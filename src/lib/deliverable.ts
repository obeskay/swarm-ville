import type { Run } from "../types";

export interface Deliverable {
  /** A whole HTML document the builder produced, when there is one. */
  html: string | null;
  /** The plain-language wrap-up: the archivist's note, else the last useful step. */
  summary: string;
}

const lastDone = (run: Run, phase: string) =>
  [...run.steps].reverse().find((step) => step.phase === phase && step.status === "done")?.output ?? "";

/** Finds a complete page in a fenced block, or a bare document the model forgot to fence. */
export const findHtml = (text: string): string | null => {
  const fenced = text.match(/```html\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text.slice(Math.max(0, text.search(/<!doctype html|<html[\s>]/i)));
  return /<(!doctype html|html[\s>])/i.test(candidate) && /<\/html>/i.test(candidate) ? candidate.trim() : null;
};

/** What a finished run leaves you: a page to open, and a few words about it. */
export const deliverable = (run: Run): Deliverable => ({
  html: findHtml(lastDone(run, "build")),
  summary: (lastDone(run, "archive") || lastDone(run, "verify") || lastDone(run, "build")).trim()
});
