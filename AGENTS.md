# AGENTS.md

## What this project is
`planner juridico (3).html` is the whole app: one self-contained HTML file (HTML + CSS + vanilla JS), no build step, no backend, no package manager. Data lives in the browser's `localStorage` (keys prefixed `pj_`). `planner juridico.html` is an older version kept only for reference — **edit `planner juridico (3).html`**, it is the one served.

## Running it (sandbox / Base44)
```bash
docker compose -f docker-compose.base44.yml up -d
```
- `web` service: `node:22-alpine`, repo bind-mounted at `/app`, runs `node serve.mjs` on port 3000.
- `serve.mjs` is a zero-dependency static server: it serves the planner file at `/` (and `/index.html`), serves any other repo file by path, and injects a small `/__reload` event-stream snippet so the page reloads itself ~1s after the HTML file is saved.
- Nothing to install, migrate or seed. No environment variables or external services are required.

## Gotchas
- The canonical filename contains spaces and parentheses — always quote it in shell commands.
- Edits to the HTML are visible on refresh with no rebuild because the file is served from the bind mount; `serve.mjs` itself is also live (restart `web` if you edit it).
- There are no tests or linters in the repo.

## How to verify
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` → `200`, page title `Planner Jurídico — Alexandra`.
- In the browser: bottom nav switches sections (Início, Hoje, Progresso, … Timer, Cards); the console should stay free of errors.
