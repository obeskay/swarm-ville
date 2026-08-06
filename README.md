# SwarmVille

A small product village where you plant software ideas and watch the swarm grow
them into shippable releases.

SwarmVille runs a real agentic loop and renders it as a place: five agents, five
plots, one commons. An agent walking to its bench with a lit ring is mid-model-call.
An arc between two agents is a handoff. Walk your own avatar into the commons and
a peer-to-peer video call opens with whoever else is standing there.

The map is the readout: the world is a low-poly Three.js village with blocky
characters, a custom avatar, animated critters, fences, work plots, a commons,
a market, paths, water and product gardens.

## Product garden

The Product garden is the playable loop around the agentic loop:

1. Plant a product with a name, kind and objective.
2. Select its plot from the HUD or directly from the 3D map.
3. Send it to the swarm. The plot advances through plan, design, build, review,
   verify and ship as the real run emits steps. Design is the product-facing
   milestone; the backend's planner and builder still produce the observable
   model calls behind it.
4. Tend a plot with energy to grow it between swarm runs, recharge energy with
   coins, buy fertilizer or energy at the market, unlock new plots, and complete
   evergreen or daily village quests for extra rewards.
5. Harvest the shipped release to earn coins, gems, energy and XP. Profile
   progress and plots persist in the browser's local storage.

The four product seeds are Web app, Mobile, AI agent and Data tool. Starter
briefs make the first planting fast, and a plot can be replanted after harvest
for another iteration. A shipped plot opens Product Studio: edit the generated
HTML, CSS, JavaScript or README, create new files, publish revisions, preview
them in an iframe, or download a runnable single-file app and a workspace
manifest. The village is
usable on narrow screens too: the map, active panel and toolbelt collapse into
a readable mobile stack.

<!-- Screenshot: run `npm run dev` and grab the map. -->

## The loop

```
plan ──▶ build ──▶ review ──┬── PASS ──▶ verify ──▶ archive
            ▲               │
            └─── REVISE ────┘   (bounded by MAX_REVISIONS)
```

Each phase is one model call by one agent. The reviewer's verdict is what closes
the loop: `VERDICT: REVISE` sends control back to the builder.

| Agent | Phase | Plot |
|---|---|---|
| Atlas | Plan | Plan |
| Neo | Build | Build |
| Socrates | Review | Review |
| Vanguard | Verify | Review |
| Alexandria | Archive | Memory |

## Observability

Every model call is recorded as a **step** and nothing on screen is invented:

- wall-clock latency per step
- input and output tokens per step, summed per run
- the attempt number, so revise cycles are visible as repeats
- the full model output, expandable inline
- the failure reason when a step fails

Where an agent is standing and whether its ring is lit are derived from the same
records. Product XP and rewards are game state owned by the garden, not model
confidence or an invented quality score.

## Quick start

Node 20+.

```bash
npm install
npm run dev
```

Open <http://127.0.0.1:5173>. This starts the Vite dev server on 5173 and the
relay on 8765; Vite proxies `/api` and `/ws` to the relay, so the browser only
ever talks to one origin.

It works out of the box with no API key: the default `mock` provider runs the
whole loop offline, revise cycle included.

## Providers

Pick one from the selector in the top bar, or set `PROVIDER` in `.env`.

| id | What it is | Needs |
|---|---|---|
| `mock` | Offline simulator. The default. | nothing |
| `ollama` | Local models over Ollama | Ollama running locally |
| `anthropic` | Claude via the Anthropic API | `ANTHROPIC_API_KEY` |

Keys are read by the relay from the environment and never reach the browser.
Copy `.env.example` to `.env` to configure. If a provider cannot be constructed
(missing key, missing SDK) the relay falls back to `mock` and says so in the top
bar instead of failing silently.

## The commons

Click the ground to walk. Step into the circle and you join the room: the relay
hands you the list of peers already there, and your browser opens a WebRTC
connection to each. Media is peer-to-peer — the relay only forwards SDP and ICE.

Declining the camera prompt is fine; you join as a listener. Public STUN covers
the same machine and the same LAN; crossing a symmetric NAT needs a TURN server
(see `.env.example`).

## HTTP API

The relay is usable without the UI.

```bash
curl localhost:8765/api/health
curl localhost:8765/api/state
curl -X POST localhost:8765/api/runs \
  -H 'content-type: application/json' \
  -d '{"goal":"Add rate limiting to the public REST API"}'
curl -X POST localhost:8765/api/runs/stop
```

WebSocket lives at `/ws` and pushes `snapshot`, `run`, `event`, `agent`,
`handoff`, `provider`, presence and WebRTC signalling messages.

## Layout

```
server/
  index.js          HTTP + WebSocket, security middleware
  config.js         env and flag parsing
  security.js       rate limits, origin checks, body caps, sanitising
  orchestrator.js   the agentic loop
  state.js          bounded in-memory world state
  rooms.js          presence + WebRTC signalling
  providers/        mock, ollama, anthropic
src/
  world/            three.js town
  ui/               panels
  lib/              WebSocket client, WebRTC mesh
```

## Scripts

```bash
npm run dev        # relay + web
npm run relay      # relay only
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production bundle
```

## Security

Local-first by default: binds `127.0.0.1`, allowlists origins, and has **no
authentication**. Read [SECURITY.md](SECURITY.md) before putting it on a
network.

## License

MIT — see [LICENSE](LICENSE).
