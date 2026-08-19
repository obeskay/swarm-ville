import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join, resolve } from "node:path";
import { config } from "./config.js";

/**
 * An address for a shipped plot.
 *
 * Product Studio could already build a single-file app; the loop just ended in
 * your downloads folder. Publishing writes that document under
 * `.data/releases/<id>.html` and the relay serves it back at `/r/<id>`, so a
 * release is something you can open in another tab or hand to somebody on the
 * same network.
 *
 * Deliberately not Vercel or GitHub. A tool that binds to 127.0.0.1 and has no
 * authentication has no business holding a deploy token.
 */

const DIR = config.releaseDir;

/** Ids are hex from randomUUID, so a path can never escape the directory. */
const ID = /^[0-9a-f]{12}$/;

const fileFor = (id) => join(DIR, `${id}.html`);

export const publish = async (html) => {
  const id = randomUUID().replace(/-/g, "").slice(0, 12);
  await mkdir(DIR, { recursive: true });
  await writeFile(fileFor(id), html, "utf8");
  return id;
};

export const read = async (id) => {
  if (!ID.test(id)) return null;
  const path = fileFor(id);
  // Belt and braces: the pattern already forbids separators and dots.
  if (!resolve(path).startsWith(resolve(DIR))) return null;
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
};
