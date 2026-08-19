/**
 * Generate every SwarmVille art asset with gpt-image-2 through the private relay.
 * Resumable: an asset whose PNG already exists in art/raw is skipped, so a
 * rerun only fills the gaps. `size` is ignored by the API, so the aspect ratio
 * is asked for inside the prompt and fixed later by tools/pixelize.py.
 */
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const RAW = `${ROOT}art/raw`;
mkdirSync(RAW, { recursive: true });

const manifest = JSON.parse(readFileSync(`${ROOT}art/manifest.json`, "utf8"));
const KEY =
  process.env.RELAY_KEY ||
  execSync(`grep -o 'ANTHROPIC_AUTH_TOKEN="[^"]*"' ~/.zshrc | head -1 | sed 's/.*="//;s/"//'`, {
    shell: "/bin/zsh"
  })
    .toString()
    .trim();

const ENDPOINT = "https://claude.cloud.obeskay.com/openai/v1/images/generations";
const CONCURRENCY = 6;

const jobs = [
  ...manifest.tiles.map((t) => ({
    name: t.name,
    prompt: `${manifest.style} A ${t.prompt}. The texture must tile seamlessly with no visible border, no frame, no drop shadow, no text, no watermark. Perfectly square 1:1 image, flat top-down view, evenly lit.`,
    transparent: false
  })),
  ...manifest.props.map((p) => ({
    name: p.name,
    prompt: `${manifest.style} A single game sprite of ${p.prompt}. One object only, centred, filling about 85% of the frame, standing upright as it would in a top-down village map. Fully transparent background, no ground shadow, no frame, no text, no watermark.${
      /aspect ratio/.test(p.prompt) ? "" : " Square 1:1 image."
    }`,
    transparent: true
  })),
  ...manifest.chars.map((c) => ({
    name: c.name,
    prompt: `${manifest.style} Character turnaround sheet: the SAME chibi villager drawn 4 times in a single horizontal row, evenly spaced with clear empty gaps between them. Left to right the poses are: facing the viewer, facing left in profile, seen from behind, facing right in profile. The character is 3 heads tall with a simple friendly face and two dot eyes, wearing a ${c.shirt} shirt and ${c.trousers} trousers, with ${c.hair} hair. Thin dark outline, flat shading. Fully transparent background, no ground shadow, no frame, no text, no watermark. Wide landscape image, 4:1 aspect ratio.`,
    transparent: true
  }))
];

const todo = jobs.filter((j) => !existsSync(`${RAW}/${j.name}.png`));
console.log(`${jobs.length} assets, ${todo.length} to generate`);

let done = 0;
async function run(job) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: job.prompt,
          quality: "high",
          n: 1,
          ...(job.transparent ? { background: "transparent" } : {})
        })
      });
      const body = await res.json();
      const url = body?.data?.[0]?.url;
      if (!url) throw new Error(JSON.stringify(body).slice(0, 200));
      const png = Buffer.from(await (await fetch(url)).arrayBuffer());
      writeFileSync(`${RAW}/${job.name}.png`, png);
      console.log(`  ✓ ${job.name} (${++done}/${todo.length})`);
      return;
    } catch (err) {
      console.log(`  ! ${job.name} attempt ${attempt}: ${err.message}`);
      if (attempt === 3) console.log(`  ✗ ${job.name} FAILED`);
      else await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }
}

const queue = [...todo];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await run(queue.shift());
  })
);
console.log("done");
