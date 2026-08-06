import { config } from "./config.js";
import { resolveProvider } from "./providers/index.js";
import {
  AGENTS,
  addRun,
  emit,
  getRun,
  logEvent,
  newId,
  resetAgents,
  setAgentState,
  state
} from "./state.js";

/**
 * The agentic loop.
 *
 * plan -> build -> review -> (revise -> build)* -> verify -> archive
 *
 * Every phase is one model call by one agent. The reviewer's verdict is what
 * closes the loop: a REVISE sends control back to the builder, up to
 * `limits.maxRevisions` times. Each call is recorded as a step with its own
 * latency, token usage and output, which is what the map and the run panel
 * render — the observability is the run record, not a decoration on top of it.
 */

const AGENT_BY_ID = new Map(AGENTS.map((agent) => [agent.id, agent]));

const PHASES = {
  plan: {
    agentId: "planner",
    label: "Plan",
    system:
      "You are the planner of a small software swarm. Break the objective into " +
      "at most five concrete, ordered steps. No preamble, no restating the task.",
    prompt: ({ goal }) => `Objective: ${goal}\n\nWrite the plan.`
  },
  build: {
    agentId: "builder",
    label: "Build",
    system:
      "You are the builder of a small software swarm. Carry out the plan and " +
      "report what you actually changed. Be specific and brief. No preamble.",
    prompt: ({ goal, plan, critique }) =>
      critique
        ? `Objective: ${goal}\n\nPlan:\n${plan}\n\nThe reviewer asked for changes:\n${critique}\n\nAddress the critique and report the revised work.`
        : `Objective: ${goal}\n\nPlan:\n${plan}\n\nCarry it out and report the work.`
  },
  review: {
    agentId: "reviewer",
    label: "Review",
    system:
      "You are the reviewer of a small software swarm. Judge the work against " +
      "the objective: correctness, edge cases, security, dead code. Be brief and " +
      "concrete. End your reply with exactly one line: 'VERDICT: PASS' or " +
      "'VERDICT: REVISE'.",
    prompt: ({ goal, work }) =>
      `Objective: ${goal}\n\nWork submitted:\n${work}\n\nReview it.`
  },
  verify: {
    agentId: "verifier",
    label: "Verify",
    system:
      "You are the verifier of a small software swarm. Confirm the objective is " +
      "actually met and name anything still missing. Be brief. No preamble.",
    prompt: ({ goal, work }) =>
      `Objective: ${goal}\n\nAccepted work:\n${work}\n\nVerify it against the objective.`
  },
  archive: {
    agentId: "archivist",
    label: "Archive",
    system:
      "You are the archivist of a small software swarm. Write a two-sentence " +
      "record of what was done and what was learned. No preamble.",
    prompt: ({ goal, work }) => `Objective: ${goal}\n\nOutcome:\n${work}\n\nWrite the record.`
  }
};

/** Output kept per step, so a chatty model cannot bloat the transported run. */
const MAX_STEP_OUTPUT = 4000;

const runners = new Map();

const trimOutput = (text) =>
  text.length > MAX_STEP_OUTPUT ? `${text.slice(0, MAX_STEP_OUTPUT)}…` : text;

const firstLine = (text) => text.split("\n").find((line) => line.trim()) || "working…";

const readVerdict = (text) => (/VERDICT:\s*REVISE/i.test(text) ? "revise" : "pass");

const publishRun = (run) => emit("run", run);

/**
 * Runs one phase: marks the agent busy, calls the provider, records the step.
 * Throws only on abort; provider failures are recorded on the step and
 * rethrown so the run can fail loudly rather than pretend to succeed.
 */
const runPhase = async ({ run, phase, context, attempt, provider, signal }) => {
  const spec = PHASES[phase];
  const agent = AGENT_BY_ID.get(spec.agentId);

  const step = {
    id: newId("step"),
    phase,
    label: spec.label,
    agentId: agent.id,
    attempt,
    status: "running",
    startedAt: Date.now(),
    ms: 0,
    output: "",
    usage: { inputTokens: 0, outputTokens: 0 },
    error: null
  };

  run.steps.push(step);
  setAgentState(agent.id, "working");
  publishRun(run);
  emit("step", { runId: run.id, step });

  const started = Date.now();
  try {
    const result = await provider.complete({
      phase,
      goal: run.goal,
      attempt,
      system: spec.system,
      prompt: spec.prompt(context),
      signal
    });

    step.status = "done";
    step.ms = Date.now() - started;
    step.output = trimOutput(result.text);
    step.usage = result.usage;
    step.model = result.model;

    run.usage.inputTokens += result.usage.inputTokens || 0;
    run.usage.outputTokens += result.usage.outputTokens || 0;

    setAgentState(agent.id, "idle");
    logEvent(agent.id, firstLine(step.output));
    publishRun(run);
    emit("step", { runId: run.id, step });

    return step;
  } catch (error) {
    step.status = signal.aborted ? "stopped" : "failed";
    step.ms = Date.now() - started;
    step.error = signal.aborted ? "stopped by operator" : error.message;

    setAgentState(agent.id, "idle");
    logEvent(agent.id, step.error, signal.aborted ? "info" : "error");
    publishRun(run);
    emit("step", { runId: run.id, step });

    throw error;
  }
};

const finish = (run, status, note = null) => {
  run.status = status;
  run.note = note;
  run.endedAt = Date.now();
  run.ms = run.endedAt - run.startedAt;
  resetAgents();
  publishRun(run);
  logEvent(
    "archivist",
    status === "done" ? `Run complete in ${(run.ms / 1000).toFixed(1)}s` : `Run ${status}`,
    status === "failed" ? "error" : "info"
  );
};

/** Starts a run. Only one runs at a time; a second request is rejected. */
export const startRun = async (goal) => {
  if (runners.size > 0) throw new Error("run_in_progress");

  const { provider, fallbackReason } = await resolveProvider(state.provider);
  if (fallbackReason) {
    state.providerNote = fallbackReason;
    emit("provider", { provider: "mock", note: fallbackReason });
  }

  const controller = new AbortController();
  const run = addRun({
    id: newId("run"),
    goal,
    status: "running",
    provider: provider.id,
    model: provider.model,
    startedAt: Date.now(),
    endedAt: null,
    ms: 0,
    revisions: 0,
    steps: [],
    usage: { inputTokens: 0, outputTokens: 0 },
    note: null
  });

  runners.set(run.id, controller);
  publishRun(run);
  logEvent("planner", `New objective: ${goal}`);

  // Drive the loop in the background; the caller only needs the run record.
  (async () => {
    const signal = controller.signal;
    try {
      const planStep = await runPhase({
        run,
        phase: "plan",
        context: { goal },
        attempt: 0,
        provider,
        signal
      });

      let work = "";
      let critique = null;

      for (let attempt = 0; attempt <= config.limits.maxRevisions; attempt += 1) {
        emit("handoff", { from: attempt === 0 ? "planner" : "reviewer", to: "builder" });
        const buildStep = await runPhase({
          run,
          phase: "build",
          context: { goal, plan: planStep.output, critique },
          attempt,
          provider,
          signal
        });
        work = buildStep.output;

        emit("handoff", { from: "builder", to: "reviewer" });
        const reviewStep = await runPhase({
          run,
          phase: "review",
          context: { goal, work },
          attempt,
          provider,
          signal
        });

        if (readVerdict(reviewStep.output) === "pass") break;

        critique = reviewStep.output;
        run.revisions += 1;
        publishRun(run);

        if (attempt === config.limits.maxRevisions) {
          run.note = `Accepted after ${run.revisions} revision cycles without a PASS verdict.`;
          logEvent("reviewer", run.note, "warn");
        }
      }

      emit("handoff", { from: "reviewer", to: "verifier" });
      const verifyStep = await runPhase({
        run,
        phase: "verify",
        context: { goal, work },
        attempt: 0,
        provider,
        signal
      });

      emit("handoff", { from: "verifier", to: "archivist" });
      await runPhase({
        run,
        phase: "archive",
        context: { goal, work: verifyStep.output },
        attempt: 0,
        provider,
        signal
      });

      finish(run, "done", run.note);
    } catch (error) {
      finish(run, controller.signal.aborted ? "stopped" : "failed", error.message);
    } finally {
      runners.delete(run.id);
    }
  })();

  return run;
};

export const stopRun = (runId) => {
  const target = runId || state.activeRunId;
  const controller = runners.get(target);
  if (!controller) return false;
  controller.abort();
  return true;
};

export const isRunning = () => runners.size > 0;

/** Aborts everything in flight — used on shutdown. */
export const stopAll = () => {
  for (const controller of runners.values()) controller.abort();
  runners.clear();
};

export { getRun };
