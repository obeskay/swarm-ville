# Deploying SwarmVille

SwarmVille is one program. It serves the web page **and** does the work behind it, on one port (8765). Pick the way that suits you.

Settings go in a file called `.env` next to this one. Copy `.env.example` to `.env` and remove the `#` in front of a line to turn it on. You can skip this at first: everything has a safe default.

## 1. On your own computer

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run build
npm start
```

Open <http://localhost:8765>. Stop it with Ctrl+C.

If the page is missing, the start-up text says `app: not served`. You skipped `npm run build`.

## 2. Docker

You need [Docker](https://docs.docker.com/get-docker/).

```bash
docker build -t swarm-ville .
docker run -d --name swarmville --restart unless-stopped \
  -p 127.0.0.1:8765:8765 \
  -e ACCESS_CODE=pick-a-long-secret \
  -v swarmville-data:/app/.data \
  swarm-ville
```

Open <http://localhost:8765>.

- `-p 127.0.0.1:8765:8765` keeps it private to this machine. Use `-p 8765:8765` to let others on your network in, and only with `ACCESS_CODE` set.
- `-v swarmville-data:/app/.data` keeps what the app remembers when you replace the container.
- The image starts with `PROVIDER=mock`: pretend agents, no key, no cost. To use a real one add `--env-file .env` (with `PROVIDER=` and its key in that file).

## 3. Docker Compose

The same thing, written down once.

```bash
cp .env.example .env        # then edit .env: at least ACCESS_CODE and PROVIDER
docker compose up -d --build
```

| Do this | Command |
| --- | --- |
| See what it is doing | `docker compose logs -f` |
| Update to a new version | `git pull && docker compose up -d --build` |
| Stop it (data is kept) | `docker compose down` |

Check it is alive: open <http://localhost:8765/api/health>. It should say `"status":"ok"`.

## Putting it on the internet (HTTPS)

Two things need to be true before you share a link:

1. **Set `ACCESS_CODE`.** Without it, anyone who finds the address can use your model budget. The start-up text prints a `WARNING` if you forget.
2. **Use HTTPS.** Camera and microphone (the meeting room) only work on `https://` or on `localhost`. On any other address the browser blocks them.

The easiest HTTPS is [Caddy](https://caddyserver.com). It gets and renews the certificate for you. Point your domain at the machine, open ports 80 and 443, then run:

```bash
caddy reverse-proxy --from your.domain --to localhost:8765
```

Then add this to `.env` and restart:

```
ACCESS_CODE=pick-a-long-secret
TRUST_PROXY=1
```

`TRUST_PROXY=1` tells SwarmVille to look at who is really visiting instead of seeing only Caddy. Turn it on **only** when the proxy is the sole way in (keep `HOST=127.0.0.1`, which is the default, or the `127.0.0.1:` in the Docker port). If people can also reach port 8765 directly, they can fake their address.

### Invite link

Send people this:

```
https://your.domain/?code=SECRET
```

Opening it gets them in, and their browser remembers the code. Anyone with the link or the code can use the app, so share it like a password. To lock everyone with the old link out, change `ACCESS_CODE` and restart.

Someone without the link sees a lock screen where they can type the code instead.

## Settings that matter

| Variable | Default | What it does |
| --- | --- | --- |
| `PORT` | `8765` | Port to listen on. |
| `HOST` | `127.0.0.1` (Docker image: `0.0.0.0`) | Who can connect. `127.0.0.1` means only this machine. |
| `ACCESS_CODE` | none (open) | One shared code for everyone. When set, the app shows a lock screen and the API refuses anyone without it. |
| `PROVIDER` | `agy` (Docker image: `mock`) | Which model does the work: `agy`, `agy-pro`, `crosstalk`, `claude`, `ollama`, `anthropic`, or `mock` (fake, free). |
| `ANTHROPIC_API_KEY` | none | Key for `PROVIDER=anthropic`. Stays on the server. Also `ANTHROPIC_MODEL`. |
| `OLLAMA_URL`, `OLLAMA_MODEL` | `http://127.0.0.1:11434`, `llama3.2` | For `PROVIDER=ollama`, which runs on your own machine. |
| `ALLOWED_ORIGINS` | local dev addresses | Extra websites allowed to talk to it. Not needed for the normal case: the address the app is served from is always allowed. |
| `TRUST_PROXY` | off | Read the visitor's address from your reverse proxy. See above. |
| `QUEUE_MAX` | `12` | How many ideas can wait in the shared line, the one running included. |
| `JOBS_PER_PEER` | `2` | How many ideas one person can have in the line at once. |
| `ARCHIVE_FILE`, `RELEASE_DIR` | `.data/archive.jsonl`, `.data/releases` | Where finished runs and published pages are kept. In Docker these sit in the `/app/.data` volume, so keep the volume. |
| `STATIC_DIR` | `dist` | Folder with the built app. Rarely changed. |

## If something is off

- **Blank page or "not served":** run `npm run build` first (Docker does this for you).
- **Camera or mic will not start:** you are not on HTTPS or localhost.
- **Behind a proxy the page loads but never connects ("origin not allowed"):** set `ACCESS_CODE` or `TRUST_PROXY=1`. A private SwarmVille (`HOST=127.0.0.1`, no code) only accepts browsers that reach it as `localhost`, which protects a laptop from websites that try to trick the browser into talking to it.
- **"Too many requests" for everybody at once:** you are behind a proxy and `TRUST_PROXY=1` is not set, so everyone looks like one visitor.
- **Docker: cannot reach it:** check the port you published, and do not set `HOST` to `127.0.0.1` inside the container.

## What this is not

Honest limits, so nothing surprises you:

- **No accounts.** There is one shared code. Everyone who has it is equal, and there is no way to remove one person except to change the code for all.
- **One shared swarm, one shared bill.** Everyone's ideas go into the same line and run on the same model key. `QUEUE_MAX` and `JOBS_PER_PEER` limit how much one visitor can queue. They do not cap the total spend.
- **Ownership belongs to a connection, not a person.** Whoever had the tab open owns the ideas they put in the line. Close the tab or lose the connection and their waiting ideas are dropped (a run already in progress carries on).
- **Published pages are public.** A page published from a result lives at `/r/<id>` and opens for anyone with that link, even when `ACCESS_CODE` is set. The link is hard to guess, but treat it as public.
- **One copy only.** Runs and the line live in one process's memory. Do not run several copies behind a load balancer.
- **Not a hardened public service.** The code is a shared secret, and the limits are per visitor address. It suits a team, a class or a few friends, not the open web.
