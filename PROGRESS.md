# Progress Log

Read this file first in any new session before doing more work — it's the
single source of truth for what's done and what's next.

## Status: Campaign engine + Act 1 + Act 2 content built and verified live; Act 3 not yet written
Date: 2026-09-10

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

## What's built (Stage 7)
A moral (good↔evil) and ethical (lawful↔chaotic) spectrum, each -100..100,
with a derived classic 9-cell D&D alignment label — the last of the
README's stated core pillars. Folded into `narrate_turn` rather than given
its own resolve-round-trip tool, since (unlike a dice roll) there's no
secret math to hide from the model — the DM decides the shift size itself,
same as `hitPointChange` already did.

- `shared/src/alignment.ts` — `Alignment { moral, ethical }`,
  `moralLabel`/`ethicalLabel` (thresholded at ±33 into Good/Neutral/Evil
  and Lawful/Neutral/Chaotic), `alignmentLabel` (combines both into the
  classic name — "True Neutral", "Neutral Good", "Lawful Neutral",
  "Chaotic Evil", etc.), `clampAlignmentValue`, and `shiftAlignment`. Pure
  and unit-tested the same way as the rest of `shared/`.
- `shared/src/character.ts` — `Character` gained `alignment: Alignment`,
  seeded at `{ moral: 0, ethical: 0 }` (True Neutral) for every new
  character.
- `shared/src/dm.ts` — added `DmAlignmentShift { moralDelta?, ethicalDelta?,
  reason }` and an optional `alignmentShift` field on `DmTurnResult`.
- `server/src/dm/systemPrompt.ts` — now states the character's current
  alignment (label + both raw axis values) alongside HP/AC/skills, and
  instructs the DM to let it carry real narrative weight: NPCs who'd
  plausibly have heard of the character should react to their reputation,
  and it should inform (never gate) suggested choices. This is the
  "harder, more open-ended half" the Stage 6 notes flagged — mostly prompt
  craft, not code.
- **A real bug, found and fixed via live testing**: the first
  implementation nested `alignmentShift` as an object under `narrate_turn`
  (mirroring `hitPointChange`'s existing shape), and it reliably corrupted
  — the model would emit stray tool-call-like syntax into the field
  instead of clean JSON, spilling `ethicalDelta`/`reason` out as sibling
  keys at the top level. Isolated debugging (a standalone script hitting
  the real API directly, bypassing the app) proved this happens whenever
  more than one tool is declared alongside a nested-object field — 3/3
  failures with 2 or 3 tools present, 3/3 clean with only `narrate_turn`
  declared alone. Since `request_check`/`level_up` are always offered
  together with `narrate_turn` in this app, that's every real turn — this
  wasn't a one-off glitch. The fix: `DM_TURN_TOOL`'s schema now has zero
  nested objects — `hitPointChange` and `alignmentShift` are flattened
  into top-level scalar fields (`hitPointDelta`/`hitPointChangeReason`,
  `moralDelta`/`ethicalDelta`/`alignmentShiftReason`), confirmed 3/3 clean
  after the change. `server/src/dm/sanitizeDmTurnResult.ts` reconstructs
  the nested `DmHitPointChange`/`DmAlignmentShift` shapes our code still
  uses internally from those flat wire fields, dropping anything that
  doesn't parse rather than trusting a raw cast — this is also a general
  hardening of `narrate_turn`'s freeform output (unlike `request_check`/
  `level_up`, whose results are reconstructed server-side from validated
  inputs, `narrate_turn`'s side-effect fields were previously trusted via
  a direct `as DmTurnResult` cast with no validation at all).
  **Implication for later stages**: any future tool field on `narrate_turn`
  must stay flat — no nested objects — or it inherits this same failure
  mode the moment a second tool is in play, which is always.
- Client: `App.tsx` gained `applyAlignmentShift` (clamped via
  `shiftAlignment`); `StoryShell.tsx` renders a `⚖️` log line showing the
  delta and the resulting label (e.g. "Alignment shifts +10 moral (toward
  good), -10 ethical (toward chaotic) — ... Now: True Neutral.");
  `CharacterSheet.tsx` shows the current label under the character's
  subtitle.
- 8 new unit tests (`alignment.test.ts`) — shared suite is now 37/37.
- Verified live end to end against the real Claude API, including the
  bug hunt above: confirmed the corrupted nested-object failure 3/3 times
  in isolation, confirmed the flattened-schema fix 3/3 clean in isolation,
  then confirmed it end to end through the real app — a single turn where
  the player shielded a fugitive with a false oath produced a failed
  Deception check (`request_check`), a hit-point loss, *and* a correctly
  net alignment shift (+10 moral, −10 ethical, landing back at True
  Neutral) all in one coherent turn, rendered correctly in both the log
  and the character sheet.
- `npm run build` (all three workspaces) and `npm test` both pass.

## What's built (Stage 8)
Single-slot `localStorage` autosave — the hard requirement for a genuine
multi-session "campaign," per the assessment earlier in this project's
history. Character creation now only shows up when there's truly no saved
game; otherwise the app resumes exactly where the player left off,
including a page refresh, with no wasted DM call for a re-generated
opening scene.

- `client/src/features/persistence/gameSave.ts` — `GameSave { character,
  storyEntries, suggestedChoices }` and `loadGame()`/`saveGame()`/
  `clearGame()`, all wrapped in `try/catch` (storage can fail — quota,
  private browsing — and losing the autosave isn't fatal, so failures are
  swallowed rather than crashing the app) and validated with a runtime
  type guard (`isGameSave`) rather than trusting whatever JSON happens to
  be sitting under the key. One save slot, not named/multiple saves — the
  simplest thing that makes "a campaign survives a refresh" true; multiple
  saves would be a natural but unrequired follow-up.
- `App.tsx` — `character`, `entries`, and `suggestedChoices` all moved up
  from `StoryShell` into `App` (read once from `loadGame()` at module
  scope for the initial state), since all three needed to be in one place
  to autosave together. A single `useEffect` calls `saveGame(...)`
  whenever any of the three changes. Added `startNewGame()` — confirms via
  `window.confirm`, then clears storage and resets all three to empty —
  and a "Start a new adventure" link in `StoryShell` wired to it.
- `StoryShell.tsx` — no longer owns `entries`/`suggestedChoices` as local
  state; both are now props with `onEntriesChange`/`onSuggestedChoicesChange`
  callbacks, making it a fully controlled component. The mount effect that
  fires the opening DM turn now also checks `entries.length === 0` (not
  just the existing StrictMode-double-invoke guard) — resuming a save with
  history already present skips the opening call entirely rather than
  re-narrating a fresh scene on top of a resumed one.
- `Character` and `StoryEntry` needed no changes to become
  JSON-serializable — true by construction since Stage 2 (no functions, no
  class instances), so Stage 8 didn't need to arrange anything there.
- Verified live end to end in-browser: played two real turns against the
  live Claude API, confirmed the autosave landed in `localStorage` after
  each (checked directly via injected JS, not just inference), refreshed
  the page and confirmed the exact same story log, choices, and character
  sheet came back with **no new DM call fired** (the automated browser
  environment auto-dismisses native `confirm()` dialogs, which was itself
  useful confirmation that the "cancel" path of `startNewGame` correctly
  does nothing), then stubbed `window.confirm` to return `true` and
  confirmed "Start a new adventure" correctly cleared `localStorage` and
  returned to a blank character creation screen that stayed blank across
  a further refresh.
- `npm run build` (all three workspaces) and `npm test` (still 37/37,
  unaffected — this stage was client-only) both pass.

## Where this leaves the project
Per the assessment when Stage 6 started: two stages were called out as
hard requirements before this could be called a genuinely operating
campaign — leveling (Stage 6) and persistence (Stage 8, this one). Both
are done, and alignment (Stage 7, the third README pillar) is done too.
**The core game loop described in the README is now fully playable
end to end and survives a refresh.** What's left on the original roadmap
is Stage 9 (polish, balancing, playtesting — inherently ongoing, not a
single discrete milestone) and Stage 10 (a modding/scripting layer,
explicitly called out as future work in the README, not required for
playability).

## Next up (Stage 9): polish, balancing, playtesting — for the live-DM mode
The items below were written for the live-LLM-DM game (Stages 4–8). That
mode is **no longer the app's default** as of the static campaign engine
below (still in the repo, dormant, not deleted) — these notes are kept for
if/when that mode gets revisited, not as active next steps.
- Unlike Stages 1–8, this isn't a single feature to build — it's an
  open-ended pass. Concrete, scoped candidates to pick from rather than
  a single mandatory next step:
  - **Content breadth**: `shared/`'s race/class/background data is still
    a deliberately small starter set (4 races, 4 classes, 4 backgrounds)
    from Stage 2 — expanding toward the full SRD 5.1 list is pure data
    entry, no architecture change needed. (This part is still relevant to
    the new campaign engine too, since it reuses the same data.)
  - **Balancing**: no actual playtesting has happened beyond short,
    deliberately-engineered test scenarios to verify each mechanic works.
    Longer real sessions would surface whether DC/damage/level-up
    judgment calls (all currently the DM's unconstrained discretion) feel
    fair over time.
  - **Combat depth**: Stage 5's `request_check` covers a single roll
    per attempt; there's no initiative order, no multi-enemy tracking, no
    concept of "the fight continues across turns" beyond what the DM
    holds in the narrated story log — worth deciding whether that's
    sufficient or whether combat needs its own structured state.
  - **UI polish**: the interface has been functional-not-polished since
    Stage 3 by design (explicitly deferred). A real pass on layout,
    typography, and the point-buy/character-creation flow would matter
    once the mechanics underneath are this far along.
- Loose end from Stage 4, still unresolved: the `/api/hello` route from
  Stage 1 is still there, unused by the real app.

## Static "Choices"-style campaign engine (new — supersedes the live DM as the default experience)
The user wanted a version that costs nothing to run and gives full
narrative control: an authored branching campaign (no free-text box, no
per-turn API cost) played by a 4-person party — 2 player-created characters
plus 2 CPU-generated companions who level up alongside them — with
decision-driven encounters, loot, curses, and multiple endings, plus side
quests that loop back into the main branches. The user supplied a
published D&D module (*Hoard of the Dragon Queen*) as structural reference;
confirmed with them this means original setting/NPCs/plot mirroring its
3-act escalation shape, not reusing the module's own copyrighted content
(it's commercial WotC IP, outside the SRD 5.1 license this project already
relies on for rules). Full design plan: `~/.claude/plans/playful-mapping-hopper.md`.

**This is additive, not a replacement of prior work**: the live-DM system
(`server/`, `client/src/features/story/dmClient.ts`, `FreeTextInput.tsx`,
the old single-character `CharacterSheet.tsx`) stays in the repo exactly as
built in Stages 4–8, just unused by the new default flow — confirmed with
the user as the preferred approach (reversible via git either way, but no
reason to delete working code).

### What's built (engine only — no real story content yet)
- **`shared/src/campaign/types.ts`** — the content model: `Scene` is a
  discriminated union of `NarrationScene` (choices → next scene id, with
  optional `effects` and a `condition` for gating a choice on a story
  flag), `EncounterScene` (choices are approaches resolved via a real
  `resolveCheck` roll against the monster's stats, branching to a distinct
  success/failure scene — **abstracted, not round-by-round tactical
  combat**, confirmed with the user as the right scope), and `EndingScene`.
  A `Campaign` is `Record<string, Scene>` — a **graph**, not a strict tree,
  since a side quest's ending scene(s) just point back at a main-branch
  scene id. `SceneEffect` is a discriminated union covering everything a
  choice can do: grant gold/an item/a curse, remove a curse, change HP,
  shift alignment, trigger a level-up, or set a story flag — each targets
  a `PartySlot` (`'pc1' | 'pc2' | 'companion1' | 'companion2'`), `'party'`
  (all four), or `'random'`.
- **`shared/src/item.ts`**, **`shared/src/curse.ts`** — small standalone
  types (not nested under `campaign/`, since they're general
  character/party concepts, not campaign-authoring-specific — avoids
  `character.ts` needing to depend on the campaign feature).
- **`shared/src/character.ts`** — `Character` gained `curses: Curse[]`
  (afflictions are personal, not party-shared) and `role: 'player' |
  'companion'`, both defaulted by `createCharacter`.
- **`shared/src/campaign/companion.ts`** — `generateCompanion()`: fills
  whichever of the 4 core classes isn't already covered by the player's 2
  picks (falls back to any class if all 4 are covered, confirmed with the
  user as the preferred "complementary" approach over fully random), then
  spends the full 27-point buy budget with a simple greedy allocator
  weighted toward that class's primary abilities, then calls
  `createCharacter` — the exact same validated path a player character
  goes through.
- **`shared/src/campaign/partyState.ts`** — `PartyState { members: [4
  Characters, fixed pc1/pc2/companion1/companion2 order], sharedGold,
  sharedTreasure, storyFlags, currentSceneId }` — the entire game state.
- **`shared/src/campaign/engine.ts`** — the resolution logic, all pure
  functions: `applyEffect`/`applyEffects` (mutates party state immutably
  per effect, returns a player-facing log line for each — mirrors the
  formatting the old live-DM `StoryShell` used for check/level-up/
  alignment results, just resolved locally instead of from a server
  response), `isChoiceAvailable` (story-flag gating), `resolveChoice`
  (applies a narration choice's effects, returns the next scene id), and
  `resolveEncounterChoice` (resolves the actor's `resolveCheck` roll,
  applies success or failure effects, branches accordingly). Every dice
  roll reuses `resolveCheck`/`resolveLevelUp`/`shiftAlignment` from
  Stages 5–7 unchanged — no new game math, just a new place to call it
  from (client-side instead of a server route).
- **`shared/src/campaign/prototype.ts`** + **`activeCampaign.ts`** — a
  small throwaway scene set (a branch, an encounter with two approaches, a
  level-up trigger, gold, HP loss, three endings) used only to verify the
  engine end-to-end; `ACTIVE_CAMPAIGN`/`CAMPAIGN_START_SCENE_ID` are the
  only things the client ever imports, so swapping in the real acts later
  is a one-line change in `activeCampaign.ts`, nothing else touches it.
- **`client/src/features/party/PartyCreation.tsx`** — new flow: create
  player character 1 → create player character 2 → auto-generate and
  reveal the 2 companions → begin. Reuses `CharacterCreationForm` twice.
  **Bug found and fixed during live testing**: without a distinct `key`
  prop on each `CharacterCreationForm` instance, React reused the same
  component instance across the two steps (same type, same tree position),
  so character 2's form silently inherited character 1's leftover ability
  scores instead of resetting to defaults. Fixed with `key="pc1"` /
  `key="pc2"`; confirmed live afterward that character 2 correctly starts
  fresh.
- **`client/src/features/story/PartyPanel.tsx`** — replaces
  `CharacterSheet.tsx` in the sidebar (that file is left in place, unused,
  matching the "keep dormant" treatment above): compact cards for all 4
  members (name, companion tag, level/race/class, alignment, HP/AC/prof,
  curses) plus shared gold/treasure.
- **`client/src/features/story/StoryShell.tsx`** rewritten: renders the
  current scene's narration + choices (filtered by `isChoiceAvailable`)
  via the unchanged `StoryLog`/`ChoiceButtons`; on choice, calls
  `resolveChoice`/`resolveEncounterChoice`, appends the resulting logs +
  next scene's narration to the entry log, and advances
  `party.currentSceneId` — synchronous, no network call, no loading state.
  `FreeTextInput` removed from the render tree (file left in place,
  unused).
- **`client/src/features/persistence/gameSave.ts`** — now persists
  `{ party: PartyState, storyEntries }` instead of a single `Character` +
  suggested choices (no longer needed — choices are always derivable from
  `currentSceneId` + `storyFlags`). An old save from the live-DM mode
  fails the new shape check and is treated as no save, which is the
  correct fallback for this new mode.
- 14 new unit tests (`companion.test.ts`, `engine.test.ts`) — shared suite
  is now 51/51. Fixed the shared test script too: it was globbing only
  `src/*.test.ts`, silently skipping subdirectories — now globs
  `src/*.test.ts src/campaign/*.test.ts` explicitly.
- Verified live end to end in the browser: created a Fighter+Rogue party,
  confirmed companions correctly filled Wizard+Cleric, walked the opening
  branch into the encounter, tried both encounter approaches (both failed
  the roll live, correctly applying HP loss and branching to the losing
  scene — the success branch and its `levelUp` effect are covered by the
  deterministic unit tests and share the identical rendering code path
  already confirmed live), reached an ending with no choices offered,
  refreshed mid-game and got the exact same state back with **no server
  call at all**, and confirmed "Start a new adventure" resets cleanly.

### What's built — Act 1: "Ash Over Millhaven"
Original story (confirmed with the user: mirrors the *structural* beat of
a settlement raided by an organized hostile force, none of the specific
plot/names/content from the reference module). `shared/src/campaign/act1.ts`,
**41 scenes**, wired up as `ACTIVE_CAMPAIGN` in `activeCampaign.ts` (the
`start`-scene id is `act1-start`).

- **Pacing note**: the user's target is roughly **2+ hours total** to play
  all acts. The first draft of Act 1 (17 scenes, ~8-scene played path) was
  far too short for a ~40-45 minute per-act share — estimated only
  6-12 minutes of real playtime. Act 1 was expanded to 41 scenes before
  being called done: each of the three opening approaches now has its own
  follow-up complication/rescue scene (not just a single check), and the
  post-raid section is a **hub-and-spoke investigation** (see below)
  instead of one optional side quest, roughly quadrupling the played-path
  length to ~16-20 scene transitions depending on how many hub spokes the
  player takes (~15-25 real minutes) — still likely light of a full 40-45
  minute share on its own, but a large step up, with the remaining gap
  expected to close across Acts 2-3's own expansion and the side quests
  still to come. See `project-campaign-target-length` memory for the
  original estimate this was scoped against.
- **Setting**: Millhaven, a river-trade town on the edge of the Thornwood.
  Raided at night by "the Ashen Circle," a cult after a ward-relic (the
  Cinderseal) kept by the town's herbalist, Old Sella — both are taken.
  A captain named Vesh and a name the party overhears but doesn't yet
  understand — "waking Umbrask" — seed Act 2/3's throughline.
- **Structure**: three opening approaches (charge the granary / spy from
  the rooftops / rally the militia) — each an `EncounterScene`, and each
  now followed by its own distinct complication scene regardless of
  success or failure on the first check (a trapped child in the granary
  fire, a second raider column to optionally shadow toward the Thornwood
  after spying, a riverside evacuation after rallying the militia) — all
  eventually converge on one `act1-raiders-retreat` scene. From there, an
  **investigation hub** (`act1-hub`) offers up to **four optional
  spokes** — interrogate a wounded raider, tend the town's wounded, search
  Old Sella's ransacked cottage, or check on the miller — each gated by
  its own story flag (`SceneCondition`, the engine's condition-gating
  exercised for the first time in real content) so a completed spoke
  disappears from the hub instead of being repeatable, and each loops back
  to the hub afterward. This is the concrete "side quests that loop back"
  mechanic the user asked for, done four times instead of once. Two spokes
  can fail their check into a **curse** ("Ashmark", "Wardburn") instead of
  their reward; the interrogation spoke's success sets `knowsRaiderCamp`
  for Act 2 to check later. The player can leave the hub at any time via
  "Enough — set out after the trail now," so none of the four spokes are
  mandatory. From there, the milestone scene triggers `levelUp` targeting
  `'party'` (all four members level up together, each with their own
  hit-die roll), then hands off to a **temporary stub ending scene**
  (`act1-end`) standing in for Act 2's real opening.
- **`shared/src/campaign/validate.ts`** (new, not in the original plan —
  added once real content existed to actually need it): `findCampaignErrors`
  (dangling `next`/`successNext`/`failureNext` references, empty choice
  lists, mismatched scene ids) and `findUnreachableScenes` (graph traversal
  from the start scene). `act1.test.ts` asserts Act 1 passes both, plus
  has exactly one ending (the stub) — this becomes the standard check for
  every future act and for the final merged campaign, catching broken
  links automatically instead of requiring a manual click-through of every
  path.
- **Bug found and fixed**: an old save from before Act 1 existed (or from
  a later act replacing an earlier one down the line) could reference a
  `currentSceneId` no longer present in `ACTIVE_CAMPAIGN`, which would
  crash the app on load (`ACTIVE_CAMPAIGN[missingId].narration` on
  `undefined`). `App.tsx` now checks this on load
  (`resolveInitialSave()`) and discards the stale save instead of
  crashing — worth remembering this matters again every time
  `ACTIVE_CAMPAIGN` changes, which will be at least twice more (Act 2, Act 3).
- 7 new unit tests (`validate.test.ts`, `act1.test.ts`) — shared suite is
  now 61/61, all still passing against the expanded 41-scene version.
- Verified live end to end in the browser (expanded version): full
  playthrough of the granary-fight → rescue path, all four hub spokes in
  sequence (confirming each spoke's story flag correctly hides it from the
  hub after completion, including one deliberately-failed check that
  correctly applied a curse to the acting character), the milestone
  level-up (all four party members to Level 2, each with an independently
  rolled HP gain), departure, and the `act1-end` stub — with zero console
  errors throughout.
- `.claude/launch.json` added (client dev server, port 5173) so future
  sessions can preview the app via the Browser tool without recreating it.

### What's built — Act 2: "Into the Thornwood"
Original story (same commitment as Act 1: structural pacing inspiration
only, no reused plot/names/content). `shared/src/campaign/act2.ts`,
**50 scenes** — the largest act yet, matching Act 1's expanded density.
`act1-departure` (Act 1's final scene) now hands off directly to
`act2-start`; the two acts are merged in `activeCampaign.ts`
(`{ ...ACT1_SCENES, ...ACT2_SCENES }`).

- **Story**: the party tracks the Ashen Circle through the Thornwood to
  their camp, scouts it, infiltrates, frees Old Sella, recovers the
  Cinderseal, and confronts Vesh directly for the first time (she retreats
  rather than being defeated outright — a recurring antagonist, not a
  one-fight villain). The eavesdrop side quest pays off "waking Umbrask"
  from Act 1: the Cinderseal is one of **three** seals on something called
  Umbrask, bound at a place called the Umbral Scar deeper in the
  Thornwood — this camp was only a waypoint, seeding Act 3's destination
  and stakes explicitly.
- **Structure**: three route choices through the Thornwood (mire / ridge /
  deep woods), each — like Act 1's three opening approaches — a two-layer
  encounter arc (an initial hazard, then a distinct complication) before
  converging on a camp sighting. **A fourth route is flag-gated on Act 1's
  `knowsRaiderCamp`** (set by successfully interrogating the wounded raider
  back in Millhaven): using the map fragment skips both hazard layers
  entirely and grants bonus gold — a concrete, mechanical payoff for an
  optional Act 1 choice carrying forward into Act 2, not just a flavor
  callback. All routes converge on `act2-hub`, a four-spoke investigation
  hub (scout the perimeter / free a captive named Rell / sabotage supplies
  / eavesdrop on Vesh) using the same flag-gated loop-back pattern Act 1
  established — freeing Rell is this act's equivalent side quest, complete
  with its own alignment-shift reward for freeing a captive with nothing
  to gain from it. From the hub, the party chooses a stealth or frontal
  infiltration approach, both converging on freeing Sella and then
  confronting Vesh directly (the act's highest-DC encounter, 15 vs. the
  10-14 range everywhere else) — win or lose that fight, Vesh retreats
  rather than the story dead-ending, consistent with the "abstracted,
  never blocks progress" pattern established in Act 1. A party-wide
  `levelUp` milestone follows, then a temporary stub ending (`act2-end`)
  standing in for Act 3's real opening, mirroring exactly how `act1-end`
  worked before Act 2 existed.
- **Test restructuring**: with two acts now cross-referencing each other's
  story flags and handing off across act boundaries, a single act's scene
  file is no longer a closed graph on its own — `findCampaignErrors`
  against `ACT1_SCENES` alone would now flag the deliberate `act2-start`
  cross-reference as dangling. `act1.test.ts` and `act2.test.ts` were
  trimmed to lightweight per-act sanity checks (start scene shape, the
  handoff choice's target, the gating condition on the shortcut route),
  and a new **`shared/src/campaign/campaign.test.ts`** became the
  canonical structural gate: `findCampaignErrors`/`findUnreachableScenes`/
  ending-count, run against the full merged `ACTIVE_CAMPAIGN` via
  `activeCampaign.ts`. This is now the real check for every future act —
  Act 3 just needs to be added to `activeCampaign.ts` and this test
  automatically covers it, no new validation test required.
- Shared suite is now 67/67 (6 net new tests: 3 replacing the old
  `act1.test.ts` assertions, 3 new in `act2.test.ts`; `campaign.test.ts`'s
  3 tests replace the reachability/error checks that used to live in
  `act1.test.ts`).
- Verified live end to end in the browser: played through Act 1's spy
  branch into the interrogation side quest (setting `knowsRaiderCamp`),
  confirmed the party-wide level-up (all four members to Level 2 with
  individually different HP gains), then into Act 2 confirming **the
  flag-gated shortcut route actually appears and works** (the direct
  mechanical payoff for the earlier choice), all four hub spokes present
  and the eavesdrop spoke's Umbral Scar/Umbrask lore reveal, the stealth
  infiltration path, freeing Sella, the Vesh confrontation (lost this
  roll — confirmed the "story continues either way" failure branch), the
  second party-wide level-up (all four members to Level 3), and the
  `act2-end` stub with the Cinderseal item in the shared treasury — zero
  console errors throughout. Also confirmed a stale save from before Act 2
  existed was correctly discarded on load by the `resolveInitialSave()`
  guard from Act 1 (still doing its job on this second campaign swap).

## Next up: Act 3
Per the agreed delivery sequence:
1. **Act 3** (climax at the Umbral Scar, paying off "waking Umbrask" and
   the three-seals setup from Act 2's eavesdrop spoke) + **3-4 distinct
   endings**, varying by which choices/flags/alignment the party carried
   forward (e.g. whether Vesh was ever truly defeated, whether the second
   and third seals were secured or lost, alignment extremes). Should be
   sized at Act 1/Act 2's scale (40-50 scenes) per the pacing target below.
   `act2-departure` currently hands off to `act2-end`, a temporary stub
   (same pattern `act1-end` used before Act 2 existed) — Act 3's real
   opening scene should be `act3-start`, and `act2-end` gets removed the
   same way `act1-end` was.
2. Wire remaining side quests, full playthrough pass, replace
   `PROTOTYPE_CAMPAIGN` usage in tests if desired (or keep it as the
   engine fixture — it's not part of the shipped campaign either way),
   update `activeCampaign.ts` to merge all three acts, update
   `campaign.test.ts`'s ending-scene-id assertion once Act 3 has its own
   real endings instead of a stub.
3. **Pacing check-in**: Acts 1+2 combined are now ~91 scenes with a
   played-path length of roughly 35-45 scene transitions depending on
   route/hub choices — likely landing in the 30-45 minute real-playtime
   range for two of three acts. See `project-campaign-target-length`
   memory for the running estimate against the user's ~2+ hour total
   target; Act 3 should aim for a comparable or slightly longer share
   (it's the climax) rather than a shorter wrap-up.

## Notes for future sessions / continuity
- This file should be updated at the end of every work session with what
  changed and what the immediate next step is, so a fresh session (or a
  fresh Claude instance) can pick up without needing prior chat history.
- To run the app: `npm install` at the repo root, then `npm run dev`
  (client on :5173, server on :3001).
