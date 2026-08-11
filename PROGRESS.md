# Progress Log

Read this file first in any new session before doing more work — it's the
single source of truth for what's done and what's next.

## Status: Stage 1 complete — skeleton app running end to end
Date: 2026-08-11

## Tech stack (decided)
- **Client**: Vite + React + TypeScript (`client/`)
- **Server**: Node + Express + TypeScript, run via `tsx` in dev (`server/`)
  — holds the future `ANTHROPIC_API_KEY` and will make Claude API calls
  server-side so the key never reaches the browser
- **Monorepo**: npm workspaces (root `package.json` lists `client` and
  `server` as workspaces); `concurrently` runs both dev servers with one
  command
- **Persistence**: deferred. No DB yet — Stage 8 (save/load) will likely
  start with browser `localStorage` plus JSON export/import, since this is
  a single-player game with no multi-device sync requirement. Revisit only
  if that turns out to be insufficient.
- Kept deliberately minimal: no test framework, linting config beyond the
  Vite defaults (`oxlint`), or CI yet — add these when there's real code
  worth protecting.

## What's built
- `client/` — Vite React TS app scaffolded via `npm create vite@latest`,
  trimmed of template boilerplate (demo counter, logos, docs links). Vite
  dev server proxies `/api/*` to `http://localhost:3001` (`client/vite.config.ts`)
  so the browser can call the backend with a relative path in both dev and
  prod (behind a reverse proxy later).
- `server/` — minimal Express app (`server/src/index.ts`) with one route,
  `GET /api/hello`, returning `{ message: "Hello from the Dungeon Master." }`.
  `server/.env.example` documents `PORT` and `ANTHROPIC_API_KEY` (the real
  `.env` is gitignored and not created yet — no key is wired up).
- Root `package.json` — npm workspaces for `client` + `server`, with
  `npm run dev` (both servers concurrently) and `npm run build`.
- Verified end to end: `npm install` at root, `npm run dev`, confirmed
  `GET /api/hello` responds directly on :3001 and through the Vite proxy on
  :5173, and confirmed in-browser that the React page fetches and renders
  "Hello from the Dungeon Master." from the Express server.
- Node.js was not installed on this machine at the start of this session;
  installed via `nvm` (v24.19.0 LTS) since there was no Homebrew either.
  `nvm` init lines were added to `~/.zshrc`.

## Next up (Stage 2): character sheet data model
- Design the core TypeScript types for a character: six ability scores
  (STR/DEX/CON/INT/WIS/CHA), race, class, background, derived modifiers,
  HP, AC, proficiency bonus — based on the SRD 5.1 rules referenced in
  README.md.
- Implement point-buy allocation logic (SRD standard: 27-point buy) as
  pure functions so they're easy to unit test later.
- Decide where this lives: probably a `shared/` or `packages/core` workspace
  so both `client` (character creation UI) and `server` (DM tool-calling
  validation) can import the same types and validation logic without
  duplication — worth deciding before Stage 3 UI work starts, since the UI
  will want to import these types directly.
- Not yet needed: persistence, leveling, combat — those are later stages.

## Notes for future sessions / continuity
- This file should be updated at the end of every work session with what
  changed and what the immediate next step is, so a fresh session (or a
  fresh Claude instance) can pick up without needing prior chat history.
- To run the app: `npm install` at the repo root, then `npm run dev`
  (client on :5173, server on :3001).
