import type { Run } from "../types";

/**
 * A bridge to Jean (jean.build), where the real work on a real repository
 * happens. Jean has no public API to call, so the bridge is the honest one: a
 * brief you can paste into any Jean chat, and a shortcut to your own Jean.
 * Its address can carry a token, so it lives in this browser only and is never
 * sent to the relay.
 */

const STORAGE = "swarm-ville.jean.v1";

export const isJeanUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

export const getJeanUrl = () => {
  try {
    return window.localStorage.getItem(STORAGE) ?? "";
  } catch {
    return "";
  }
};

export const setJeanUrl = (value: string) => {
  try {
    if (value.trim()) window.localStorage.setItem(STORAGE, value.trim());
    else window.localStorage.removeItem(STORAGE);
  } catch {
    // The field still shows what was typed; it just will not be remembered.
  }
};

const lastDone = (run: Run, phase: string) =>
  [...run.steps].reverse().find((step) => step.phase === phase && step.status === "done")?.output ?? "";

/** Everything an agent in Jean needs to pick the work up where the swarm left it. */
export const jeanBrief = (run: Run): string =>
  [
    `# ${run.goal}`,
    "",
    "This was started in SwarmVille by a small swarm of agents. Continue from here.",
    "",
    "## Plan",
    lastDone(run, "plan"),
    "",
    "## What was built",
    lastDone(run, "build"),
    "",
    "## Review and verification",
    lastDone(run, "review"),
    lastDone(run, "verify")
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n");
