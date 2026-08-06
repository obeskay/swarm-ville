# Security

## Reporting

Open a private security advisory on the repository, or email the maintainer.
Please do not open a public issue for an unpatched vulnerability.

## Threat model

SwarmVille is a **local-first operator tool**. It defaults to binding
`127.0.0.1` and to an origin allowlist covering only the local dev server. It
has **no authentication and no authorisation** — anyone who can reach the relay
can start runs and join the room. Treat exposing it publicly as a decision that
requires putting an authenticating proxy in front of it.

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
| Only one run executes at a time; a second request gets `409` | `server/orchestrator.js` |
| `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` | `server/index.js` |

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

Provider responses are rendered as **text only** — never as HTML, and never
executed. The orchestrator reads exactly one thing out of a model response: a
`VERDICT: PASS` / `VERDICT: REVISE` line, matched against a fixed pattern. A
model cannot steer the loop beyond that, and the revise cycle is bounded by
`MAX_REVISIONS`.

## Before exposing this to a network

1. Put an authenticating reverse proxy in front of the relay.
2. Set `ALLOWED_ORIGINS` to your real origin.
3. Terminate TLS (the client upgrades to `wss://` automatically).
4. Lower `MAX_CONNECTIONS`, `RATE_LIMIT_RPM` and `ROOM_CAPACITY` to fit.
5. Remember there is still no per-user identity — add one if you need it.
