# Progress Log

Read this file first in any new session before doing more work — it's the
single source of truth for what's done and what's next.

## Status: Stage 4 complete — LLM Dungeon Master integration, verified live end to end
Date: 2026-08-19

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
- **Shared code**: a third workspace, `shared/` (`@tavern-tales/shared`),
  holds game-rule types and pure logic that both `client` and `server` will
  need (character data model now; DM tool-call schemas later). It exports
  raw `.ts` directly (no build step required in dev) — `tsx` (server) and
  Vite (client) both transpile workspace-linked TS on the fly. `npm run
  build -w shared` still exists for a real `dist/` when needed.
- No test framework added for `client`/`server` yet, but `shared` uses
  Node's built-in `node:test` + `node:assert` (run via `tsx --test`) since
  it's pure logic worth protecting with unit tests, and this needed no new
  dependency. Revisit with a real framework (Vitest, etc.) if UI or server
  logic later needs component/integration tests.

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

## What's built (Stage 2)
All in `shared/src/`, exported from `shared/src/index.ts`:
- `abilities.ts` — `AbilityName`/`AbilityScores` types, `abilityModifier`
  (SRD floor((score-10)/2)), `proficiencyBonusForLevel` (+2 at level 1,
  +1 every 4 levels).
- `pointBuy.ts` — SRD standard 27-point buy: cost table for scores 8-15,
  `pointBuyCost`, and `validatePointBuy` (returns valid/pointsUsed/
  pointsRemaining/errors — used by `createCharacter` and reusable later by
  a character-creation UI for live feedback as the player allocates points).
- `race.ts`, `characterClass.ts`, `background.ts` — data-driven types
  (`Race`, `CharacterClass`, `Background`) each with a small starter seed
  array (4 races: Human/Elf/Dwarf/Halfling; 4 classes: Fighter/Wizard/
  Rogue/Cleric; 4 backgrounds: Acolyte/Soldier/Criminal/Sage) and a
  `get*(id)` lookup that throws on an unknown id. Deliberately not the full
  SRD catalog (13 classes, 9 races, 13 backgrounds) — more can be added
  incrementally without touching any other code, since everything reads
  from these arrays.
- `character.ts` — the `Character` interface (id, name, race/class/
  background ids, level, base + final ability scores, ability modifiers,
  proficiency bonus, hit points, armor class) and `createCharacter(input)`,
  a pure factory that validates the point-buy allocation, applies racial
  ability increases, and derives HP (class hit die + CON modifier) and AC
  (10 + DEX modifier) for a level-1 character. Throws on invalid input
  (bad point-buy spend, unknown race/class/background id) rather than
  silently coercing, since a DM tool-call handler downstream needs to
  reject bad state changes loudly, not guess.
- 14 unit tests across `abilities.test.ts`, `pointBuy.test.ts`,
  `character.test.ts` (`npm run test -w shared`, or `npm test` from root) —
  all passing. `npm run typecheck -w shared` and root `npm run build` also
  verified clean.
- Not wired into `client` or `server` yet — no UI or API route imports
  `@tavern-tales/shared` yet. That starts in Stage 3 (character creation
  screen) and later in the DM tool-calling layer.

## What's built (Stage 3)
`client` now depends on `@tavern-tales/shared` (`"@tavern-tales/shared": "*"`
in `client/package.json`, resolved via the npm workspace symlink — no build
step needed since Vite transpiles the linked TS source directly).

- `features/characterCreation/` — `CharacterCreationForm.tsx` (name input,
  race/class/background `<select>`s populated straight from `RACES`/
  `CHARACTER_CLASSES`/`BACKGROUNDS`) and `AbilityScoreAllocator.tsx` (a
  +/− stepper per ability). The allocator disables `+` the moment the next
  increment would exceed the 27-point budget and disables `−` at the
  minimum score of 8, so an invalid allocation is impossible to reach
  through the UI — `validatePointBuy` (for the live "points remaining"
  readout) and `createCharacter` (on submit) are the only calls into
  `shared` here. Submit is disabled until a name is entered and the
  allocation is valid; a thrown error from `createCharacter` (e.g. unknown
  id) surfaces as inline form text rather than crashing the app.
- `features/story/` — `StoryShell.tsx` composes `CharacterSheet.tsx`
  (name, race/class/background, HP/AC/proficiency bonus, all six ability
  scores + modifiers — reads straight off the `Character` object plus
  `getRace`/`getCharacterClass`/`getBackground` for display names),
  `StoryLog.tsx` (scrolling transcript), `ChoiceButtons.tsx` (renders a
  list of suggested strings), and `FreeTextInput.tsx` (text box + submit).
  There's no DM yet — choosing a suggested choice or submitting free text
  both just append a `player`-speaker entry to the log via one shared
  `recordPlayerAction` callback, with a static intro line saying the DM
  isn't connected. This is intentionally just wiring, not narrative logic;
  that's Stage 4.
- `App.tsx` holds `character: Character | null` in `useState` and switches
  between `CharacterCreationForm` and `StoryShell` — no router or context
  needed for two screens and this little prop-drilling.
- Verified manually end to end in-browser: built a Human Fighter (STR 15
  point-bought, remaining stats at 8) — confirmed the allocator blocked
  over-budget and sub-minimum clicks, confirmed the character sheet showed
  the correct derived values (STR 16 after the human +1, HP 9 = fighter
  d10 + CON mod −1, AC 9 = 10 + DEX mod −1, proficiency +2), then clicked a
  suggested choice and submitted free text and confirmed both landed in the
  log in order.
- `npm run build` (all three workspaces) and `npm run test -w shared`
  (still 14/14) both pass.

## What's built (Stage 4)
Real Claude-as-DM round trip, replacing the static placeholder log from
Stage 3.

- `shared/src/story.ts` — `StoryEntry`/`StorySpeaker` moved here from
  `client` (both client and server now need the shape).
- `shared/src/dm.ts` — `DmTurnRequest` (`character`, `storyLog`,
  `playerAction`) and `DmTurnResult` (`narration`, `suggestedChoices`,
  optional `hitPointChange: { delta, reason }`) — the contract between
  client and server for one DM turn.
- `server/src/dm/tool.ts` — `DM_TURN_TOOL`, a single Claude tool
  (`narrate_turn`) matching `DmTurnResult`'s shape. This is the whole
  tool-calling contract for now: the DM narrates freely in prose, but the
  only way it can change game state is by filling in `hitPointChange` on
  this one tool call — it can't just say "you take 5 damage" and have that
  silently become real. `tool_choice` is left at the default (`auto`)
  rather than forced, since forcing tool use while thinking is enabled has
  unclear support and the system prompt already instructs the model to
  always call the tool; if the DM doesn't call it, the client treats that
  as a request failure and surfaces it in the log.
- `server/src/dm/systemPrompt.ts` — builds the system prompt from the
  character sheet (name/race/class/background/level, HP/AC, ability
  scores) plus the tool-calling instruction above.
- `server/src/dm/route.ts` — `POST /api/dm/turn`. Validates the request
  shape, returns a clean `503` if `ANTHROPIC_API_KEY` isn't set (rather
  than a stack trace), calls `claude-opus-5` (overridable via
  `ANTHROPIC_MODEL`) with `output_config: { effort: "medium" }`, checks
  for `stop_reason === "refusal"`, and extracts the `narrate_turn` tool
  call from the response. The server is a stateless per-turn Claude proxy
  — it does not persist or own character state; the client applies the
  returned `hitPointChange` itself. No persistence layer exists yet
  (Stage 8), so this is the simplest thing that works for now.
- `client/src/features/story/dmClient.ts` — `requestDmTurn()`, a thin
  `fetch` wrapper around the route above.
- `StoryShell.tsx` rewritten: on mount it sends a synthetic
  `"(The adventure begins...)"` action (not shown as a player line) to get
  real opening narration and choices instead of the old hard-coded intro
  and `PLACEHOLDER_CHOICES` — both are gone. Choosing a suggested choice or
  submitting free text now calls `requestDmTurn` with the character, the
  log so far, and the new action; the response's narration and choices
  replace the old placeholders, and `hitPointChange` (if present) is
  applied to the character via a callback owned by `App.tsx`
  (`applyHitPointChange`, clamped to `[0, max]`). Errors from the request
  (missing key, rate limit, refusal, network failure) are appended to the
  log as a `system` entry rather than crashing the UI. Inputs disable
  while a request is in flight.
- Guarded the mount effect with a ref flag against React StrictMode's
  dev-only double-invoke of mount effects — without it, every page load
  fired two real (billable) DM turns instead of one.
- Verified end to end in-browser, twice: first with no `ANTHROPIC_API_KEY`
  set (confirmed the server's `503` and one clean `system`-speaker log
  entry — not two, after the StrictMode fix — proving the request/
  response/error-handling wiring), then again with a real key against the
  live Claude API — confirmed a full character creation → opening scene →
  suggested-choice click → free-text combat action sequence, and confirmed
  a real `hitPointChange` from a combat turn actually moved the character
  sheet's HP (9/9 → 5/9) live in the browser.
- Two bugs turned up and got fixed during that live verification:
  1. `ANTHROPIC_MODEL=` (empty) in `.env` sets the env var to an empty
     string, not `undefined` — `process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'`
     in `route.ts` only falls back on null/undefined, so it sent
     `model: ""` to the API and got a 400. Fixed by switching to `||`,
     which also treats an empty string as "unset". Worth remembering for
     any other optional env var read the same way later.
  2. The user's first attempt at adding the key accidentally saved the
     literal placeholder text (`sk-ant-your-actual-key-here`) from my
     instructions instead of a real key — caught by checking the value's
     length (27 chars) and prefix/suffix without ever printing the actual
     secret.
- `npm run build` (all three workspaces) passes; `npm run test -w shared`
  still 14/14 (unaffected by this stage).

## Next up (Stage 5): turn-based combat / skill-check resolver
- The one-tool DM contract from Stage 4 (`narrate_turn` + optional
  `hitPointChange`) is deliberately minimal — no dice, no proficiency
  bonus, no pass/fail. Stage 5 is where that becomes real: a roll (d20 +
  ability modifier + proficiency bonus if proficient) vs. a DC, resolved
  in code (not by asking the model to do arithmetic), with the DM's tool
  call describing *what* is being attempted (e.g. `skill_check: { ability,
  skill, dc }` or `attack: { targetAc }`) and the server resolving the
  roll and reporting the outcome back into the next turn's context.
- Decide where die-rolling logic lives — almost certainly `shared/`,
  as pure functions (`rollD20()`, `resolveSkillCheck()`) so they're
  unit-testable the same way `pointBuy.ts`/`character.ts` are, and so a
  future client-side "you rolled a 14!" UI moment can reuse the same roll
  without re-implementing it server-side.
- This is also where a second tool (or an expanded `narrate_turn` schema)
  is needed — Stage 4's tool only covers HP changes; combat needs the DM
  to declare an attack/check attempt distinct from just narrating one.
- Not yet needed: leveling (Stage 6), alignment (Stage 7), persistence
  (Stage 8) — Stage 5 is specifically about making one resolved roll work,
  the same scoping discipline as Stage 4's one-tool-call round trip.
- Loose end from Stage 4 worth resolving whenever it comes up: the
  `/api/hello` route from Stage 1 is still there, unused by the real app.

## Notes for future sessions / continuity
- This file should be updated at the end of every work session with what
  changed and what the immediate next step is, so a fresh session (or a
  fresh Claude instance) can pick up without needing prior chat history.
- To run the app: `npm install` at the repo root, then `npm run dev`
  (client on :5173, server on :3001).
