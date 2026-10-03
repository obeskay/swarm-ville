/**
 * Offline provider. Produces plausible, deterministic output so the whole
 * orchestration loop — including the revise cycle — can be exercised with no
 * API key and no network.
 */

const escape = (text) =>
  String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

/** A small real page for the offline simulator, so a finished run always has something to open. */
const page = (goal) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(goal)}</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; font: 16px/1.5 system-ui, sans-serif; background: #f4f2fb; color: #262338; }
  main { max-width: 32rem; margin: 1.5rem; padding: 2rem; border-radius: 28px; background: #fff; box-shadow: 0 12px 40px rgba(70, 60, 130, .14); }
  h1 { margin: 0 0 .5rem; font-size: 1.6rem; }
  button { margin-top: 1rem; padding: .7rem 1.2rem; border: 0; border-radius: 14px; background: #8b7cf6; color: #fff; font: inherit; cursor: pointer; }
</style>
</head>
<body>
<main>
  <h1>${escape(goal)}</h1>
  <p>Built by the SwarmVille simulator. Connect a real model to get real work.</p>
  <button onclick="this.textContent = 'Hello from your agent'">Say hello</button>
</main>
</body>
</html>`;

const LINES = {
  plan: (goal) => [
    `Objective: ${goal}`,
    "1. Map the surface area and list the files that have to change.",
    "2. Implement the smallest change that satisfies the objective.",
    "3. Review for correctness, security and dead code.",
    "4. Verify against the objective before reporting done."
  ],
  build: (goal) => [
    "```html",
    page(goal),
    "```",
    "A single self-contained page: open it in any browser, nothing to install."
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
