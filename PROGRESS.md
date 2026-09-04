# Progress Log

Read this file first in any new session before doing more work — it's the
single source of truth for what's done and what's next.

## Status: Stage 6 complete — leveling system, verified live end to end
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

## What's built (Stage 5)
Dice rolls and skill/attack checks, resolved in code — the DM proposes an
attempt and a difficulty, the server rolls and does the arithmetic, and the
DM narrates the already-decided outcome rather than inventing one.

- `shared/src/dice.ts` — `rollD20({ random? })`, a d20 roll with an
  injectable random source (defaults to `Math.random`) so tests can pin
  the result instead of asserting on randomness.
- `shared/src/skills.ts` — `SKILL_ABILITIES`, the canonical SRD 5.1
  skill → ability mapping (Athletics→STR, Stealth→DEX, Arcana→INT, etc.),
  plus `isSkillName()`. This is the first place skills exist as a typed
  concept — `background.ts`'s `skillProficiencies` was (and still is) a
  bare `string[]`; tightening that to `SkillName[]` wasn't needed for this
  stage and was left alone.
- `shared/src/check.ts` — `resolveCheck({ abilityScore, dc, proficient,
  proficiencyBonus, random? })`: SRD 5.1 math, d20 + ability modifier
  (+ proficiency bonus if proficient) vs. a DC, returning `{ roll,
  modifier, total, dc, success }`. Pure and unit-tested the same way as
  `pointBuy.ts`.
- `shared/src/dm.ts` — added `DmCheckResult` (extends `CheckResult` with
  `checkType: 'ability_check' | 'attack'`, `ability`, optional `skill`,
  and `reason`) and an optional `checkResult` field on `DmTurnResult`, so
  a turn can report the roll it made alongside the narration.
- `server/src/dm/tool.ts` — a second tool, `request_check`, alongside
  `narrate_turn` from Stage 4. The DM calls `request_check` (ability/
  skill, a DC it sets, a reason) *before* narrating anything uncertain;
  the server resolves it and the DM only then calls `narrate_turn`,
  narrating an outcome it's told rather than one it invents. This is the
  "second tool" the Stage 4 notes flagged as needed.
- `server/src/dm/resolveRequestedCheck.ts` — turns a `request_check` tool
  call into a resolved `DmCheckResult`. Notably: if a `skill` is given, the
  ability is *re-derived* from `SKILL_ABILITIES` rather than trusted from
  whatever ability the model paired it with (tool-call inputs aren't
  strictly schema-validated, so this keeps a model arithmetic/pairing slip
  from silently changing the odds) — falls back to `'STR'` for anything
  unrecognized rather than throwing mid-turn. Skill proficiency comes from
  the character's background (the only source modeled so far); an attack
  roll is simply assumed proficient (per-weapon proficiency isn't modeled
  yet — every class this stage grants is combat-capable, so this is a fair
  stand-in, not a real weapons-proficiency system).
- `server/src/dm/route.ts` — turned into a small, bounded (max 4
  iterations) manual agentic loop instead of one API call: call Claude
  with both tools → if it calls `request_check`, resolve the roll, push
  the assistant's tool call and a `tool_result` carrying the resolved
  `DmCheckResult` back onto the message history, and loop → once it calls
  `narrate_turn`, return that result with the last `checkResult` attached.
  The system prompt (`systemPrompt.ts`) now explains the two-tool sequence
  and tells the DM to skip `request_check` entirely for actions with no
  real chance of failure.
- `StoryShell.tsx` renders a `checkResult`, when present, as its own
  `system`-speaker log line ahead of the narration — e.g. "🎲 Sleight of
  Hand check: rolled 16 +3 = 19 vs DC 14 — Success!" — so the player sees
  *why* the DM's narration went the way it did, not just the prose result.
- Verified live end to end against the real Claude API (not just the
  no-key error path this time): a rogue with a Criminal background
  attempted to pickpocket a letter, the DM called `request_check` for a
  Sleight of Hand check, the server resolved a DEX+proficiency roll
  (16 + 3 = 19 vs DC 14, success), and the follow-up `narrate_turn` call
  correctly narrated a successful theft — confirmed both via a direct
  `curl` against `/api/dm/turn` and live in the browser, dice-roll line
  and all.
- 9 new unit tests (`dice.test.ts`, `check.test.ts`, `skills.test.ts`) —
  shared suite is now 23/23. `npm run build` (all three workspaces) and
  `npm test` both pass.

## What's built (Stage 6)
Milestone-based leveling: the DM signals a level-up at a genuine story
beat, the server rolls the class hit die and does the SRD 5.1 arithmetic,
and the DM narrates the moment it's given rather than inventing numbers —
the same propose → resolve → narrate pattern `request_check` established
in Stage 5, applied to a second kind of state change.

- `shared/src/dice.ts` — generalized: `rollDie(sides, options?)` now does
  the actual work, and `rollD20()` is just `rollDie(20, ...)`. Needed for
  hit dice, which vary by class (d6/d8/d10/d12).
- `shared/src/background.ts` — `Background.skillProficiencies` tightened
  from a bare `string[]` to `SkillName[]` (the existing data already
  matched the canonical SRD names from Stage 5's `skills.ts`, so this was
  a free type-safety upgrade, not a data change). Stage 5's notes had
  flagged this as deferred; doing it now is what unblocked a proper
  growable per-character skill list below.
- `shared/src/character.ts` — `Character` gained `skillProficiencies:
  SkillName[]`, seeded from the background at creation. This is the
  concrete answer to the README's "unlocks additional skill points over
  time" pillar: rather than an abstract point pool, a level-up can grant
  one additional, DM-chosen skill proficiency, and this field is what
  grows. `resolveRequestedCheck` (Stage 5) now reads proficiency from
  `character.skillProficiencies` instead of doing a fresh
  `getBackground(...)` lookup each time — same result at level 1, but now
  correctly reflects anything gained since.
- `shared/src/leveling.ts` — `resolveLevelUp({ currentLevel, hitDie,
  conModifier, random? })`: increments the level, rolls the class hit die
  for HP gained (floored at 1 per the SRD, even with a negative CON
  modifier), and recomputes the proficiency bonus via the
  `proficiencyBonusForLevel` that's existed since Stage 2. Throws past
  level 20 (`MAX_LEVEL`). Pure and unit-tested the same way as
  `check.ts`/`pointBuy.ts`.
- `shared/src/dm.ts` — added `DmLevelUpResult` (extends `LevelUpResult`
  with an optional `newSkillProficiency` and a `reason`) and an optional
  `levelUpResult` field on `DmTurnResult`.
- `server/src/dm/tool.ts` — a third tool, `level_up`, alongside
  `request_check` and `narrate_turn`. Its description is explicit that
  this should be rare ("only at a genuine story milestone... never
  routinely or more than once in a short span") — leveling is DM
  judgment, not something to gate behind a formal XP/milestone-count
  system for now.
- `server/src/dm/resolveRequestedLevelUp.ts` — turns a `level_up` tool
  call into a resolved `DmLevelUpResult` via `resolveLevelUp` plus
  skill-proficiency validation (the proposed `newSkillProficiency` must be
  a real skill the character doesn't already have, or it's dropped rather
  than trusted blindly — same defensive posture as Stage 5's ability
  re-derivation). Throws if the character is already at level 20; the
  route catches that and feeds it back to the model as a tool error
  instead of failing the whole turn, so the DM can still narrate without
  the level-up.
- `server/src/dm/route.ts` — the Stage 5 loop now dispatches on three tool
  names instead of two, and `MAX_ITERATIONS` went from 4 to 6 to leave
  room for a turn that calls both `request_check` and `level_up` before
  `narrate_turn`. The system prompt (`systemPrompt.ts`) documents all
  three tools in sequence and now shows the character's *own*
  `skillProficiencies` (not the background's) so the DM's picture stays
  current after a level-up.
- `App.tsx` gained `applyLevelUp`: bumps `level` and `proficiencyBonus`,
  adds `hitPointsGained` to both current and max HP (a level-up heals
  along with raising the cap, standard SRD behavior), and appends
  `newSkillProficiency` to the character's skill list if present and not
  already known. `StoryShell.tsx` renders a `levelUpResult`, when present,
  as its own `system`-speaker log line — e.g. "⭐ Level up! Vex reaches
  level 2 — +4 max HP, proficiency bonus +2, gained proficiency in
  Investigation." — ahead of the narration, the same pattern as Stage 5's
  dice-roll line.
- Verified live end to end against the real Claude API: fed the DM a
  story log describing a completed months-long mission and a player
  action confirming it, and the DM correctly called `level_up` (reason:
  closing out the job), the server resolved level 1→2 with +4 HP (rogue
  d8 roll + CON modifier) and granted "Investigation" as a new skill
  proficiency, and the follow-up narration correctly referenced "level 2
  now: 13 hit points" (9 + 4) — confirmed via a direct `curl` against
  `/api/dm/turn`. Separately, in the browser, a *meta* "time skip, level
  me up" request with no actual earned story progress was correctly
  **declined** by the DM, which is exactly the "rarely, only at genuine
  milestones" discipline the system prompt asks for — a good sign, not a
  bug, though it meant the live browser session itself didn't produce a
  level-up to screenshot.
- 6 new unit tests (`leveling.test.ts`, plus generalized `dice.test.ts`
  coverage for `rollDie` at other die sizes, plus a
  `character.test.ts` case for skill-proficiency seeding) — shared suite
  is now 29/29. `npm run build` (all three workspaces) and `npm test`
  both pass.

## Next up (Stage 7): alignment tracking + branching consequences
- Nothing in the character model or DM contract tracks alignment yet —
  this is the last of the README's stated core pillars ("a good/evil, and
  possibly law/chaos, alignment tracker that actually changes NPC
  reactions and available story branches") that hasn't been touched.
- Needs a place to live: probably a new field on `Character` (e.g. a
  numeric good↔evil axis, and possibly a second law↔chaos axis, rather
  than a single discrete label — a spectrum is easier to nudge
  incrementally from many small choices than a single enum flip) plus a
  fourth tool (or an extension of `narrate_turn`) for the DM to report a
  shift when the player does something alignment-relevant, following the
  same "state changes only through structured tool calls" discipline as
  Stages 4–6.
- "Changes NPC reactions and available story branches" is the harder,
  more open-ended half of this pillar — the mechanical shift (a number
  moving) is the easy part; making it *matter* means the system prompt
  needs to actually tell the DM the character's current alignment and
  instruct it to let that inform NPC attitudes and which suggested
  choices appear. Worth deciding how strongly to lean on this before
  diving in, since it's more "prompt craft + judgment" than code.
- Not yet needed: persistence (Stage 8) — Stage 7 is specifically about
  making alignment shifts real and narratively felt, the same scoping
  discipline as Stages 4–6.
- Loose end from Stage 4, still unresolved: the `/api/hello` route from
  Stage 1 is still there, unused by the real app.

## Notes for future sessions / continuity
- This file should be updated at the end of every work session with what
  changed and what the immediate next step is, so a fresh session (or a
  fresh Claude instance) can pick up without needing prior chat history.
- To run the app: `npm install` at the repo root, then `npm run dev`
  (client on :5173, server on :3001).
