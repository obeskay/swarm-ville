import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { config } from "./config.js";

/**
 * What the archivist actually keeps.
 *
 * Runs live in a ring buffer of 25 and die with the process, which made
 * Alexandria's phase the one step in the loop whose output nobody could ever
 * read again. This is the file behind her: one JSON line per finished run,
 * appended, never rewritten.
 *
 * JSONL rather than a database because a line is the whole record, `tail -f`
 * works on it, and a corrupt line costs you one run instead of the archive.
 */

const FILE = config.archiveFile;

const line = (run, summary) =>
  JSON.stringify({
    id: run.id,
    at: new Date(run.endedAt ?? Date.now()).toISOString(),
    goal: run.goal,
    summary,
    status: run.status,
    provider: run.provider,
    model: run.model,
    ms: run.ms,
    revisions: run.revisions,
    steps: run.steps.length,
    tokens: run.usage.inputTokens + run.usage.outputTokens
  });

/**
 * Never throws: a full disk or a read-only mount is a reason to lose the note,
 * not a reason to fail the run that produced it.
 */
export const remember = async (run, summary) => {
  try {
    await mkdir(dirname(FILE), { recursive: true });
    await appendFile(FILE, `${line(run, summary)}\n`, "utf8");
    return true;
  } catch (error) {
    console.warn(`archive: could not write ${FILE}: ${error.message}`);
    return false;
  }
};

/**
 * Newest first, optionally filtered by a substring of the goal or the summary.
 *
 * ponytail: reads the whole file per request. At ~400 bytes a run that is a
 * megabyte after 2,500 runs, on a relay one person talks to — swap in a reverse
 * line reader if that ever stops being funny.
 */
export const recall = async (query = "", limit = 60) => {
  let raw;
  try {
    raw = await readFile(FILE, "utf8");
  } catch {
    return [];
  }

  const needle = query.trim().toLowerCase();
  const entries = [];
  for (const text of raw.split("\n")) {
    if (!text) continue;
    try {
      const entry = JSON.parse(text);
      if (needle && !`${entry.goal} ${entry.summary}`.toLowerCase().includes(needle)) continue;
      entries.push(entry);
    } catch {
      // One bad line is one lost run, not a broken archive.
    }
  }
  return entries.reverse().slice(0, limit);
};
