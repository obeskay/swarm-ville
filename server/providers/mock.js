/**
 * Offline provider. Produces plausible, deterministic output so the whole
 * orchestration loop — including the revise cycle — can be exercised with no
 * API key and no network.
 */

const LINES = {
  plan: (goal) => [
    `Objective: ${goal}`,
    "1. Map the surface area and list the files that have to change.",
    "2. Implement the smallest change that satisfies the objective.",
    "3. Review for correctness, security and dead code.",
    "4. Verify against the objective before reporting done."
  ],
  build: (goal) => [
    `Implementing: ${goal}`,
    "Wrote the core module and wired it into the existing entry point.",
    "Kept the public surface unchanged so nothing downstream breaks.",
    "No new dependencies were introduced."
  ],
  review: () => [
    "Checked input validation, error paths and resource cleanup.",
    "No unbounded growth and no secrets in client-visible code.",
    "VERDICT: PASS"
  ],
  reviewRevise: () => [
    "The happy path is correct but two edge cases are unhandled.",
    "Empty input is not rejected and the listener is never removed.",
    "VERDICT: REVISE"
  ],
  verify: (goal) => [
    `Re-read the objective: ${goal}`,
    "Every step in the plan has a corresponding change.",
    "Result: the objective is met."
  ],
  archive: (goal) => [
    `Recorded: ${goal}`,
    "Stored the plan, the diff summary and the review verdict.",
    "Indexed for retrieval by future runs."
  ]
};

const wordCount = (text) => text.split(/\s+/).filter(Boolean).length;

const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("aborted"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });

export const createMockProvider = () => ({
  id: "mock",
  label: "Simulator",
  model: "swarmville-sim",
  async complete({ phase, goal, attempt = 0, signal }) {
    // A single revise cycle on the first review makes the loop visible.
    const key = phase === "review" && attempt === 0 ? "reviewRevise" : phase;
    const build = LINES[key] || LINES.build;
    const text = build(goal).join("\n");

    await wait(500 + Math.floor(Math.random() * 700), signal);

    return {
      text,
      model: "swarmville-sim",
      usage: { inputTokens: wordCount(goal) + 120, outputTokens: wordCount(text) }
    };
  }
});
