# Security

## Reporting

Open a private security advisory on the repository, or email the maintainer.
Please do not open a public issue for an unpatched vulnerability.

## Threat model

SwarmVille is a **local-first operator tool**. It defaults to binding
`127.0.0.1` and to an origin allowlist covering only the local dev server. It
has **no accounts and no per-user authorisation** — anyone who can reach the relay
can start runs and join the room. There is one optional shared secret,
`ACCESS_CODE`; without it, exposing the relay publicly is a decision that requires
an authenticating proxy in front of it.

## What the relay already does

| Control | Where |
|---|---|
| Origin allowlist on HTTP and on the WebSocket upgrade | `server/index.js`, `server/security.js` |
| No wildcard CORS; the origin is echoed only when allowlisted | `server/index.js` |
| Request body ceiling (16 KB) enforced while streaming, not after | `server/security.js` |
| WebSocket frame ceiling (64 KB) via `maxPayload` | `server/index.js` |
| Per-IP HTTP rate limit and per-connection message rate limit | `server/security.js` |
| Connection cap and ping/pong reaping of half-open sockets | `server/index.js` |
| Goal input is length-capped and stripped of control characters | `server/security.js` |
| Runs, steps and events live in bounded ring buffers | `server/state.js` |
| Only one run executes at a time; the rest wait in a bounded line (`QUEUE_MAX`, `JOBS_PER_PEER`) | `server/queue.js`, `server/orchestrator.js` |
| A run can be stopped, and a waiting idea withdrawn, only by the connection that left it | `server/queue.js` |
| `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` | `server/index.js` |
| Optional `ACCESS_CODE`: compared in constant time, denies by default for everything not listed as public, 10 wrong guesses a minute per address | `server/security.js` |
| Same-origin browsers are accepted, but a loopback relay with no code only trusts a `localhost` / `127.x` Host, so DNS rebinding cannot turn a website into an operator | `server/security.js` |
| A request target that does not parse answers 400 instead of throwing | `server/index.js` |
| The built app is served traversal-safe (dotfiles, symlinks, encoded and doubled separators all refused) | `server/static.js` |
| Reactions are five known ids, one per 400 ms per person; anything else is dropped | `server/rooms.js` |

## Secrets

`ANTHROPIC_API_KEY` is read from the environment by the relay and used only
there. It is never placed in a response body, an event, a log line or the
client bundle. The browser learns whether a provider is *configured*, never the
value. `.env` is git-ignored; `.env.example` carries placeholders only.

Anything prefixed `VITE_` **is** compiled into the public bundle — that is why
the only such variables are TURN settings, which should be short-lived
credentials issued by your TURN provider.

## WebRTC

Peer ids are assigned by the server, so a client cannot claim to be another
participant. The relay forwards SDP and ICE only between two peers that are
both currently in the room, stamps the sender identity itself, and caps each
signalling payload at 16 KB. Media never transits the relay.

## Model output is untrusted input

The run panel, the Board and the archive render provider responses as **text
only**. The orchestrator reads exactly one thing out of a model response to steer
the loop: a `VERDICT: PASS` / `VERDICT: REVISE` line, matched against a fixed
pattern. A model cannot steer the loop beyond that, and the revise cycle is
bounded by `MAX_REVISIONS`.

## The result preview runs model-written HTML

When the builder hands over a page, the result card shows it running in
`<iframe sandbox="allow-scripts" srcdoc=…>`. That is the one place model output is
executed, so it is treated as hostile. Without `allow-same-origin` the page lives
in an opaque origin. Checked in Chrome from inside the frame: it cannot read
`localStorage` (where a remembered access code lives), cannot read cookies or the
app's DOM, cannot navigate the window, cannot call `/api/*` (its `Origin` is
`null`, which the relay rejects) and cannot open the relay's WebSocket.

What it *can* still do is make requests to other sites, like any web page. Nothing
of yours is reachable from inside it, but do not paste secrets into a page a model
wrote. The app shell deliberately sets no `Content-Security-Policy`: a `srcdoc`
frame inherits its parent's, and a strict one would stop every generated page from
running.

## Published releases

`POST /api/releases` writes a single-file HTML document to `.data/releases/` and
`GET /r/<id>` serves it back. That document is model-written and user-edited, and
it is served from the relay's own origin, so it is treated as hostile:

- `Content-Security-Policy: sandbox allow-scripts allow-forms` drops it into an
  opaque origin. Scripts still run, but `localStorage`, `document.cookie` and
  same-origin `fetch` are all denied — verified in Chrome, both directly on the
  relay and through the Vite proxy, where the document shares an origin with the
  app itself and the guarantee matters most.
- `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`.
- Ids are 12 hex characters from `randomUUID`, matched against `^[0-9a-f]{12}$`
  before touching the filesystem, and the resolved path is checked against the
  release directory. `/r/../../package.json` returns 404.
- Bodies are capped at `MAX_RELEASE_BYTES` (512 KB by default), separately from
  the 16 KB ceiling on every other request.

There is no deletion endpoint and no authentication in front of `/r`. Anything
published is readable by anyone who can reach the relay, which on the default
binding is you. Delete `.data/releases/` to revoke.

## Before exposing this to a network

1. Set `ACCESS_CODE` (a long random string). The app shows a lock screen, every API
   call and the socket need the code, and *Copy invitation link* in Settings gives
   people a `?code=` link that walks them in. The code travels in the WebSocket URL,
   so it can show up in proxy logs: use TLS and rotate it if a log leaks.
2. Terminate TLS (the client upgrades to `wss://` automatically; the camera and
   microphone need HTTPS off `localhost`).
3. Set `TRUST_PROXY=1` **only** when the relay is reachable through your reverse
   proxy alone, and make sure the proxy *replaces* `X-Forwarded-For` rather than
   appending to it; otherwise anyone can pick their own address and defeat every
   per-address limit, the code's lockout included. Without it, everyone behind one
   proxy shares one address, and ten wrong guesses lock out all of them for a minute.
4. Set `ALLOWED_ORIGINS` if the page is served from somewhere other than the relay.
5. Lower `MAX_CONNECTIONS`, `RATE_LIMIT_RPM`, `ROOM_CAPACITY` and `QUEUE_MAX` to fit.
6. Remember there is still no per-user identity: everyone with the code shares one
   swarm, one line and one budget of model calls, and can back, and read, each
   other's ideas. `/r/<id>` releases and `/api/health` stay public on purpose.

See [DEPLOY.md](DEPLOY.md) for Docker and a copy-paste HTTPS setup.
