# Tavern Tales RPG

A turn-based RPG built on D&D-style rules (SRD 5.1) with a "Choices"-style
branching narrative UI and a live AI Dungeon Master. Suggested responses are
offered at each story beat, plus a free-text box the DM must adapt to.

## Core pillars
- D&D-style character creation: six stats, point-buy allocation, race/class/background
- Leveling system that unlocks additional skill points over time
- Turn-based combat and skill checks (roll + modifier vs. DC)
- A good/evil (and possibly law/chaos) alignment tracker that actually
  changes NPC reactions and available story branches
- An LLM-driven Dungeon Master that narrates freely but changes game state
  only through structured tool calls (so it can't contradict itself)
- Suggested-choices + open text box at every prompt
- A future scripting/mod layer so custom scenes/NPCs can be authored later

## Build roadmap (see PROGRESS.md for live status)
1. Tech stack decision + project scaffolding
2. Character sheet data model (stats, race/class, point-buy)
3. Core UI shell (story view, choice buttons, free-text box, character sheet)
4. LLM Dungeon Master integration (context + tool-calling for state changes)
5. Turn-based combat / skill-check resolver
6. Leveling system
7. Alignment tracking + branching consequences
8. Save/load persistence
9. Polish, balancing, playtesting
10. Modding/scripting layer for user-authored content

## License / rules basis
Mechanics are based on the D&D 5.1 SRD, which Wizards of the Coast makes
available under the Creative Commons license for exactly this kind of use.
