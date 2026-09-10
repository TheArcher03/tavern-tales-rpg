import type { Campaign } from './types.js'

// Act 2: "Into the Thornwood" — an original story, continuing Act 1
// ("Ash Over Millhaven"). Mirrors the pacing of a classic "track the
// raiders back to their lair" middle act: a journey through hostile
// territory, a scouted enemy camp, an infiltration, and a confrontation
// that recovers what was taken and escalates the threat for Act 3 — all
// original setting/names/content, no reused plot from any published module.
//
// Structure mirrors Act 1's shape at a larger scale: three route choices
// through the Thornwood (each a two-layer encounter arc, same density as
// Act 1's three opening approaches) converge on a camp sighting, then a
// hub scene (`act2-hub`) offers four optional flag-gated investigation
// spokes before the party commits to infiltrating. A story flag set back
// in Act 1 (`knowsRaiderCamp`, from the interrogation side quest) unlocks
// a fourth, faster route here — the payoff for that earlier choice. The
// final scene, `act2-departure`, hands off directly to `act3-start` in
// act3.ts; full graph validation lives in `campaign.test.ts` against the
// merged `ACTIVE_CAMPAIGN`.
export const ACT2_SCENES: Campaign = {
  'act2-start': {
    type: 'narration',
    id: 'act2-start',
    narration:
      'The Thornwood closes over you like a held breath — no road, no moon through the canopy, just the raiders\' trail ' +
      'pressed into the leaf-mold ahead. It splits three ways before you\'ve gone a mile: a low mire glinting between the ' +
      'trees, a stony ridge climbing out of the fog, and the trail itself vanishing straight on into deeper woods.',
    choices: [
      { label: 'Cut through the mire — the tracks skirt its edge', next: 'act2-mire' },
      { label: 'Climb the ridge for a vantage before committing to a path', next: 'act2-ridge' },
      { label: 'Push straight on through the deep woods, following the trail', next: 'act2-deepwoods' },
      {
        label: "Use the map fragment — it marks a faster way straight to the camp",
        next: 'act2-shortcut',
        condition: { flag: 'knowsRaiderCamp' },
      },
    ],
  },

  // ========================================================================
  // Route A: the mire
  // ========================================================================
  'act2-mire': {
    type: 'encounter',
    id: 'act2-mire',
    narration:
      'The mire is black water and rotten roots, the raiders\' tracks vanishing into it as though they crossed without ' +
      'sinking. There isn\'t an obvious dry path — only guesses about where the ground might hold.',
    monster: { name: 'The Mire', description: 'Not a creature — deep water, hidden roots, and no clear footing.', ac: 12, hp: 0 },
    choices: [
      {
        label: 'Wade through and pull the others along (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 13,
        successNext: 'act2-mire-won',
        failureNext: 'act2-mire-lost',
        successEffects: [{ type: 'grantGold', amount: 6 }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -3, reason: 'you go under to the waist before finding footing' }],
      },
      {
        label: 'Leap root to root and find the safe line (DEX)',
        actor: 'pc2',
        ability: 'DEX',
        skill: 'Acrobatics',
        dc: 13,
        successNext: 'act2-mire-won',
        failureNext: 'act2-mire-lost',
        successEffects: [{ type: 'setFlag', flag: 'foundDryLine' }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc2', delta: -3, reason: 'a root gives way and drops you into the black water' }],
      },
    ],
  },
  'act2-mire-won': {
    type: 'narration',
    id: 'act2-mire-won',
    narration:
      'You find solid ground faster than the raiders themselves seem to have — the party crosses dry-footed and ahead of ' +
      'schedule. Something moves beneath the surface behind you, unhurried, patient, and very large.',
    choices: [{ label: 'Keep moving before it decides you look like dinner', next: 'act2-mire-creature' }],
  },
  'act2-mire-lost': {
    type: 'narration',
    id: 'act2-mire-lost',
    narration:
      'You make it across soaked, bruised, and slower than you\'d like — and the disturbance in the water behind you says ' +
      'you weren\'t alone down there.',
    choices: [{ label: 'Keep moving before it catches up', next: 'act2-mire-creature' }],
  },
  'act2-mire-creature': {
    type: 'encounter',
    id: 'act2-mire-creature',
    narration:
      'It surfaces in a single motion — pale, eel-bodied, longer than a person is tall, with a mouth that opens wrong ways. ' +
      'A Mire Lurker, hunting the easiest meal in reach. That meal is you.',
    monster: { name: 'Mire Lurker', description: 'A pale, eel-bodied ambush predator, fast in water and slow on land.', ac: 12, hp: 14 },
    choices: [
      {
        label: 'Drive it off before it drags anyone under (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 13,
        successNext: 'act2-mire-creature-won',
        failureNext: 'act2-mire-creature-lost',
        successEffects: [{ type: 'grantItem', item: { id: 'lurker-scale', name: 'Mire Lurker Scale', description: 'A single iridescent scale, tougher than it has any right to be.' } }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -4, reason: 'a mouthful of needle teeth catches your arm' }],
      },
      {
        label: 'Get everyone onto dry land before it can strike (DEX)',
        actor: 'companion1',
        ability: 'DEX',
        dc: 12,
        successNext: 'act2-mire-creature-won',
        failureNext: 'act2-mire-creature-lost',
        successEffects: [{ type: 'setFlag', flag: 'mireCleanEscape' }],
        failureEffects: [{ type: 'hitPointChange', target: 'companion1', delta: -3, reason: 'it clips a leg on the way past' }],
      },
    ],
  },
  'act2-mire-creature-won': {
    type: 'narration',
    id: 'act2-mire-creature-won',
    narration:
      'It gives up the chase once the ground firms under your boots — mire creatures don\'t hunt where they can\'t swim. ' +
      'You leave the black water behind and press on toward higher, drier country, the trail still ahead of you.',
    choices: [{ label: 'Continue toward the camp', next: 'act2-camp-approach' }],
  },
  'act2-mire-creature-lost': {
    type: 'narration',
    id: 'act2-mire-creature-lost',
    narration:
      'It finally breaks off the chase once you\'re well clear of the water, but not before drawing blood. You press on, ' +
      'favoring the wound, the trail still ahead of you.',
    choices: [{ label: 'Continue toward the camp', next: 'act2-camp-approach' }],
  },

  // ========================================================================
  // Route B: the ridge
  // ========================================================================
  'act2-ridge': {
    type: 'encounter',
    id: 'act2-ridge',
    narration:
      'The ridge is steep, loose scree over bare rock, fog thickening the higher you climb. A vantage point waits at the ' +
      'top — if you can reach it without the whole slope giving way underfoot.',
    monster: { name: 'The Ridge', description: 'Not a creature — loose scree, poor footing, a long way down.', ac: 12, hp: 0 },
    choices: [
      {
        label: 'Climb the steadiest-looking line (DEX)',
        actor: 'companion2',
        ability: 'DEX',
        skill: 'Acrobatics',
        dc: 13,
        successNext: 'act2-ridge-won',
        failureNext: 'act2-ridge-lost',
        successEffects: [{ type: 'setFlag', flag: 'ridgeVantage' }],
        failureEffects: [{ type: 'hitPointChange', target: 'companion2', delta: -3, reason: 'the scree gives way and you slide a dozen feet' }],
      },
      {
        label: 'Read the rock for handholds before committing (Perception)',
        actor: 'pc2',
        ability: 'WIS',
        skill: 'Perception',
        dc: 12,
        successNext: 'act2-ridge-won',
        failureNext: 'act2-ridge-lost',
        successEffects: [{ type: 'grantGold', amount: 6 }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc2', delta: -2, reason: 'a misjudged handhold costs you a fall' }],
      },
    ],
  },
  'act2-ridge-won': {
    type: 'narration',
    id: 'act2-ridge-won',
    narration:
      'The top of the ridge gives you a clean line of sight through a gap in the fog — smoke, distant, low to the ground, ' +
      'exactly where the trail is headed. Voices carry faintly on the wind: a patrol, close, moving your way.',
    choices: [{ label: 'Get off the exposed ridge before they spot you', next: 'act2-ridge-scouts' }],
  },
  'act2-ridge-lost': {
    type: 'narration',
    id: 'act2-ridge-lost',
    narration:
      'You reach the top scraped and out of breath rather than gracefully, but the view is worth it — smoke on the ' +
      'horizon, and closer, voices on the wind. A patrol, and they\'re not far.',
    choices: [{ label: 'Get off the exposed ridge before they spot you', next: 'act2-ridge-scouts' }],
  },
  'act2-ridge-scouts': {
    type: 'encounter',
    id: 'act2-ridge-scouts',
    narration:
      'Two Ashen Scouts pick their way along the ridge path below, close enough to hear boots on stone if you move wrong. ' +
      'There\'s no good cover up here — only the choice of how to handle them.',
    monster: { name: 'Ashen Scouts', description: 'A two-person raider patrol, watching their own backtrail.', ac: 13, hp: 10 },
    choices: [
      {
        label: 'Freeze and let them pass without a sound (Stealth)',
        actor: 'pc2',
        ability: 'DEX',
        skill: 'Stealth',
        dc: 14,
        successNext: 'act2-ridge-scouts-won',
        failureNext: 'act2-ridge-scouts-lost',
        successEffects: [{ type: 'setFlag', flag: 'scoutsUnaware' }],
      },
      {
        label: 'Talk your way past as fellow travelers (Deception)',
        actor: 'companion1',
        ability: 'CHA',
        skill: 'Deception',
        dc: 14,
        successNext: 'act2-ridge-scouts-won',
        failureNext: 'act2-ridge-scouts-lost',
        successEffects: [{ type: 'grantItem', item: { id: 'scout-token', name: 'Ashen Circle Passphrase Token', description: "A crude clay disc the scouts didn't think to ask for back — it might buy a moment's hesitation from another patrol." } }],
      },
    ],
  },
  'act2-ridge-scouts-won': {
    type: 'narration',
    id: 'act2-ridge-scouts-won',
    narration:
      'They move on without ever knowing you were there. You have a heading now, and a head start — the camp is close, ' +
      'nestled in a hollow below the fog line.',
    choices: [{ label: 'Descend toward the camp', next: 'act2-camp-approach' }],
  },
  'act2-ridge-scouts-lost': {
    type: 'narration',
    id: 'act2-ridge-scouts-lost',
    narration:
      'One of them catches a flicker of movement and calls out — you\'re forced to break cover and scramble down the far ' +
      'side of the ridge before they can raise a real alarm. You make it clear, breathless, but not quietly.',
    choices: [
      {
        label: 'Descend toward the camp',
        next: 'act2-camp-approach',
        effects: [{ type: 'hitPointChange', target: 'random', delta: -2, reason: 'a hasty scramble down loose rock leaves someone bruised' }],
      },
    ],
  },

  // ========================================================================
  // Route C: the deep woods
  // ========================================================================
  'act2-deepwoods': {
    type: 'encounter',
    id: 'act2-deepwoods',
    narration:
      'The trees close ranks the deeper you go, the trail thinning to broken twigs and the occasional scuffed print. ' +
      'Losing it here means losing hours — or worse, losing each other.',
    monster: { name: 'The Deep Woods', description: 'Not a creature — a trail that keeps threatening to disappear.', ac: 12, hp: 0 },
    choices: [
      {
        label: 'Read the sign carefully and hold the trail (Survival)',
        actor: 'companion2',
        ability: 'WIS',
        skill: 'Survival',
        dc: 13,
        successNext: 'act2-deepwoods-won',
        failureNext: 'act2-deepwoods-lost',
        successEffects: [{ type: 'setFlag', flag: 'heldTheTrail' }],
      },
      {
        label: 'Piece together the raiders\' likely route from the terrain (Investigation)',
        actor: 'pc1',
        ability: 'INT',
        skill: 'Investigation',
        dc: 13,
        successNext: 'act2-deepwoods-won',
        failureNext: 'act2-deepwoods-lost',
        successEffects: [{ type: 'grantGold', amount: 6 }],
      },
    ],
  },
  'act2-deepwoods-won': {
    type: 'narration',
    id: 'act2-deepwoods-won',
    narration:
      'You hold the trail true, gaining ground on the raiders with every hour — until a low growl from the underbrush ' +
      'reminds you the Thornwood has its own residents, and you\'ve just walked into one\'s territory.',
    choices: [{ label: 'Stand your ground', next: 'act2-deepwoods-stalker' }],
  },
  'act2-deepwoods-lost': {
    type: 'narration',
    id: 'act2-deepwoods-lost',
    narration:
      'You lose the trail twice and have to backtrack, precious time bleeding away — and then a low growl from the ' +
      'underbrush makes clear you\'ve wandered somewhere you shouldn\'t have.',
    choices: [{ label: 'Stand your ground', next: 'act2-deepwoods-stalker' }],
  },
  'act2-deepwoods-stalker': {
    type: 'encounter',
    id: 'act2-deepwoods-stalker',
    narration:
      'A Thorned Stalker circles into view — a lean, quilled predator drawn out of its usual range by the smoke and ' +
      'noise of the raiders\' passage. It hasn\'t decided yet whether you\'re a threat or a meal.',
    monster: { name: 'Thorned Stalker', description: 'A lean, quill-backed woodland predator, more territorial than truly vicious.', ac: 13, hp: 16 },
    choices: [
      {
        label: 'Meet it head-on before it can choose its moment (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 14,
        successNext: 'act2-deepwoods-stalker-won',
        failureNext: 'act2-deepwoods-stalker-lost',
        successEffects: [{ type: 'grantItem', item: { id: 'stalker-quill', name: 'Thorned Stalker Quill', description: 'A quill as long as a dagger, still faintly barbed.' } }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -5, reason: 'a raking quill-strike catches you across the ribs' }],
      },
      {
        label: 'Back away slowly and convince it you\'re not worth the trouble (Animal Handling)',
        actor: 'companion2',
        ability: 'WIS',
        skill: 'Animal Handling',
        dc: 13,
        successNext: 'act2-deepwoods-stalker-won',
        failureNext: 'act2-deepwoods-stalker-lost',
        successEffects: [{ type: 'alignmentShift', target: 'party', ethicalDelta: 5, reason: 'you chose not to kill something that was only defending its territory' }],
        failureEffects: [{ type: 'hitPointChange', target: 'companion2', delta: -4, reason: 'it charges before you finish backing off' }],
      },
    ],
  },
  'act2-deepwoods-stalker-won': {
    type: 'narration',
    id: 'act2-deepwoods-stalker-won',
    narration:
      'It breaks off, satisfied you\'re more trouble than you\'re worth, and vanishes back into the underbrush. Ahead, ' +
      'the trees start to thin — and with them, the smell of woodsmoke grows unmistakable.',
    choices: [{ label: 'Press on toward the smoke', next: 'act2-camp-approach' }],
  },
  'act2-deepwoods-stalker-lost': {
    type: 'narration',
    id: 'act2-deepwoods-stalker-lost',
    narration:
      'It finally withdraws, but not before leaving its mark. Ahead, the trees start to thin, and the smell of woodsmoke ' +
      'grows unmistakable.',
    choices: [{ label: 'Press on toward the smoke', next: 'act2-camp-approach' }],
  },

  // ========================================================================
  // Shortcut (only offered if Act 1's interrogation side quest succeeded)
  // ========================================================================
  'act2-shortcut': {
    type: 'narration',
    id: 'act2-shortcut',
    narration:
      'The map fragment from Millhaven turns out to be worth more than gold — a mark in a dead man\'s hand shows a game ' +
      'trail that cuts straight past the mire, the ridge, and the deep woods\' worst ground. You reach the camp\'s ' +
      'outskirts well ahead of where the other routes would have put you, rested and unhurt.',
    choices: [
      {
        label: 'Approach the camp',
        next: 'act2-camp-approach',
        effects: [
          { type: 'grantGold', amount: 10 },
          { type: 'setFlag', flag: 'usedShortcut' },
        ],
      },
    ],
  },

  // ========================================================================
  // Convergence and investigation hub
  // ========================================================================
  'act2-camp-approach': {
    type: 'narration',
    id: 'act2-camp-approach',
    narration:
      'From cover at the treeline, the Ashen Circle\'s camp spreads out below — a ring of tents around a central fire, ' +
      'a picketed horse line, and at the center, a cage of green-wood stakes. Old Sella is in it, alive, and a lone ' +
      'sentry paces a slow circuit with no particular urgency. Whatever they\'re planning, they\'re not expecting company.',
    choices: [{ label: 'Get a proper look before doing anything', next: 'act2-hub' }],
  },

  'act2-hub': {
    type: 'narration',
    id: 'act2-hub',
    narration:
      'You have time, cover, and the advantage of surprise — for now. Every choice here costs minutes you could spend ' +
      'closing in instead.',
    choices: [
      {
        label: 'Scout the perimeter for guard patterns',
        next: 'act2-scout-perimeter',
        condition: { flag: 'scoutPerimeterDone', equals: false },
      },
      {
        label: 'Free the chained captive near the supply tent',
        next: 'act2-free-captive',
        condition: { flag: 'captiveFreed', equals: false },
      },
      {
        label: "Sabotage the raiders' supplies",
        next: 'act2-sabotage',
        condition: { flag: 'sabotageDone', equals: false },
      },
      {
        label: "Creep close enough to overhear Vesh's tent",
        next: 'act2-eavesdrop',
        condition: { flag: 'eavesdropDone', equals: false },
      },
      { label: 'Move now — free Sella and recover the Cinderseal', next: 'act2-infiltrate-choice' },
    ],
  },

  // --- Hub spoke: scout the perimeter ---
  'act2-scout-perimeter': {
    type: 'encounter',
    id: 'act2-scout-perimeter',
    narration:
      'Circling the treeline at a crouch, you try to map how many sentries there really are, and where the gaps in ' +
      'their rounds fall.',
    monster: { name: 'The Camp Perimeter', description: 'Not a fight — a pattern to be read correctly or missed.', ac: 12, hp: 0 },
    choices: [
      {
        label: 'Time the sentries\' rounds precisely (Perception)',
        actor: 'pc2',
        ability: 'WIS',
        skill: 'Perception',
        dc: 13,
        successNext: 'act2-scout-perimeter-won',
        failureNext: 'act2-scout-perimeter-lost',
        successEffects: [
          { type: 'setFlag', flag: 'scoutPerimeterDone' },
          { type: 'setFlag', flag: 'knowsGuardPattern' },
          { type: 'grantGold', amount: 8 },
        ],
        failureEffects: [{ type: 'setFlag', flag: 'scoutPerimeterDone' }],
      },
      {
        label: 'Circle wide and stay unseen while you count them (Stealth)',
        actor: 'companion1',
        ability: 'DEX',
        skill: 'Stealth',
        dc: 13,
        successNext: 'act2-scout-perimeter-won',
        failureNext: 'act2-scout-perimeter-lost',
        successEffects: [
          { type: 'setFlag', flag: 'scoutPerimeterDone' },
          { type: 'setFlag', flag: 'knowsGuardPattern' },
        ],
        failureEffects: [{ type: 'setFlag', flag: 'scoutPerimeterDone' }],
      },
    ],
  },
  'act2-scout-perimeter-won': {
    type: 'narration',
    id: 'act2-scout-perimeter-won',
    narration:
      'A clear picture forms: six sentries, a gap in their rounds near the horse line wide enough to walk through if you ' +
      'time it right. Whatever you decide next, you\'ll go in knowing more than they think you do.',
    choices: [{ label: 'Head back to cover', next: 'act2-hub' }],
  },
  'act2-scout-perimeter-lost': {
    type: 'narration',
    id: 'act2-scout-perimeter-lost',
    narration:
      'The rounds are less regular than they looked from a distance — you come away with only a rough guess, not the ' +
      'clean picture you wanted.',
    choices: [{ label: 'Head back to cover', next: 'act2-hub' }],
  },

  // --- Hub spoke: free the captive ---
  'act2-free-captive': {
    type: 'encounter',
    id: 'act2-free-captive',
    narration:
      'Chained to a stake near the supply tent is a gaunt, sun-scarred trapper — Rell, by the look of the brand on his ' +
      'satchel, gone missing from the trade roads weeks before Millhaven was ever touched. He\'s watching you with the ' +
      'flat, careful eyes of someone who has learned not to hope out loud.',
    monster: { name: 'A Bored Guard', description: 'Half-watching the captive, mostly watching the fire instead.', ac: 12, hp: 8 },
    choices: [
      {
        label: 'Pick the lock on his chain quietly (Sleight of Hand)',
        actor: 'pc2',
        ability: 'DEX',
        skill: 'Sleight of Hand',
        dc: 14,
        successNext: 'act2-free-captive-won',
        failureNext: 'act2-free-captive-lost',
        successEffects: [
          { type: 'setFlag', flag: 'captiveFreed' },
          { type: 'setFlag', flag: 'knowsCampLayout' },
          { type: 'alignmentShift', target: 'party', moralDelta: 8, reason: 'you freed a stranger with nothing to gain from it but risk' },
        ],
        failureEffects: [
          { type: 'setFlag', flag: 'captiveFreed' },
          { type: 'grantCurse', target: 'random', curse: { id: 'snaremark', name: 'Snaremark', description: 'A raider snare-trap grazed you retrieving the captive — old traps in the Thornwood seem to notice you now.' } },
        ],
      },
      {
        label: 'Snap the chain by force before the guard turns around (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 14,
        successNext: 'act2-free-captive-won',
        failureNext: 'act2-free-captive-lost',
        successEffects: [
          { type: 'setFlag', flag: 'captiveFreed' },
          { type: 'setFlag', flag: 'knowsCampLayout' },
          { type: 'grantItem', item: { id: 'rells-knife', name: "Rell's Trail Knife", description: 'A well-worn skinning knife, pressed on you by a man with nothing else left to give.' } },
        ],
        failureEffects: [
          { type: 'setFlag', flag: 'captiveFreed' },
          { type: 'hitPointChange', target: 'pc1', delta: -3, reason: 'the guard turns in time to land one solid hit before you drop him' },
        ],
      },
    ],
  },
  'act2-free-captive-won': {
    type: 'narration',
    id: 'act2-free-captive-won',
    narration:
      'Rell doesn\'t waste breath on thanks — he points, hand shaking, toward the largest tent. "That\'s where they took ' +
      'the old woman. And whatever\'s in the pit behind it, they don\'t go near after dark. Not even Vesh." He\'s gone ' +
      'into the trees before you can ask what he means.',
    choices: [{ label: 'Head back to cover', next: 'act2-hub' }],
  },
  'act2-free-captive-lost': {
    type: 'narration',
    id: 'act2-free-captive-lost',
    narration:
      'It\'s messier than you wanted, but Rell gets clear regardless, melting into the trees the moment his hands are ' +
      'free — no thanks, no explanation, just relief.',
    choices: [{ label: 'Head back to cover', next: 'act2-hub' }],
  },

  // --- Hub spoke: sabotage supplies ---
  'act2-sabotage': {
    type: 'encounter',
    id: 'act2-sabotage',
    narration:
      'The supply tent holds feed, spare weapons, and — more usefully — the waterskins for the whole camp. Fouling or ' +
      'scattering enough of it could slow the Ashen Circle down considerably when this goes loud.',
    monster: { name: 'The Supply Tent', description: 'Unguarded, but close enough to the fire that any noise carries.', ac: 11, hp: 0 },
    choices: [
      {
        label: 'Work quickly and quietly through the stores (Sleight of Hand)',
        actor: 'companion1',
        ability: 'DEX',
        skill: 'Sleight of Hand',
        dc: 13,
        successNext: 'act2-sabotage-won',
        failureNext: 'act2-sabotage-lost',
        successEffects: [
          { type: 'setFlag', flag: 'sabotageDone' },
          { type: 'setFlag', flag: 'suppliesSabotaged' },
          { type: 'grantGold', amount: 10 },
        ],
        failureEffects: [{ type: 'setFlag', flag: 'sabotageDone' }],
      },
      {
        label: 'Know exactly what to ruin and how (Investigation)',
        actor: 'pc2',
        ability: 'INT',
        skill: 'Investigation',
        dc: 13,
        successNext: 'act2-sabotage-won',
        failureNext: 'act2-sabotage-lost',
        successEffects: [
          { type: 'setFlag', flag: 'sabotageDone' },
          { type: 'setFlag', flag: 'suppliesSabotaged' },
        ],
        failureEffects: [
          { type: 'setFlag', flag: 'sabotageDone' },
          { type: 'grantCurse', target: 'random', curse: { id: 'tanglefoot', name: 'Tanglefoot', description: "A snapped tripwire in the supply tent left a welt that never quite healed right — rope and rigging seem to work against you now." } },
        ],
      },
    ],
  },
  'act2-sabotage-won': {
    type: 'narration',
    id: 'act2-sabotage-won',
    narration:
      'Waterskins fouled, spare bowstrings cut, a sack of feed quietly scattered for the horses to founder on — small ' +
      'things, but they\'ll matter later. You slip back out without anyone the wiser.',
    choices: [{ label: 'Head back to cover', next: 'act2-hub' }],
  },
  'act2-sabotage-lost': {
    type: 'narration',
    id: 'act2-sabotage-lost',
    narration:
      'A tripwire you didn\'t see nearly gives you away — you get out, and you did some damage, but not as cleanly or as ' +
      'thoroughly as you\'d hoped.',
    choices: [{ label: 'Head back to cover', next: 'act2-hub' }],
  },

  // --- Hub spoke: eavesdrop on Vesh's tent ---
  'act2-eavesdrop': {
    type: 'encounter',
    id: 'act2-eavesdrop',
    narration:
      'Vesh\'s tent sits apart from the rest, firelight throwing her shadow against the canvas as she paces, talking to ' +
      'someone — or something — you can\'t see. Getting close enough to hear means crossing open ground first.',
    monster: { name: "Vesh's Tent", description: "Well-lit and closely watched — the hardest place in camp to approach unseen.", ac: 14, hp: 0 },
    choices: [
      {
        label: 'Creep in through the tent\'s blind side (Stealth)',
        actor: 'companion2',
        ability: 'DEX',
        skill: 'Stealth',
        dc: 15,
        successNext: 'act2-eavesdrop-won',
        failureNext: 'act2-eavesdrop-lost',
        successEffects: [
          { type: 'setFlag', flag: 'eavesdropDone' },
          { type: 'setFlag', flag: 'umbraskLoreLearned' },
          { type: 'grantItem', item: { id: 'vesh-journal', name: "Vesh's Field Journal", description: '"...the Cinderseal is one of three. The others we know. The Umbral Scar wakes only when all three are seated. We carry this one there next, whatever the cost."' } },
        ],
        failureEffects: [
          { type: 'setFlag', flag: 'eavesdropDone' },
          { type: 'hitPointChange', target: 'companion2', delta: -3, reason: 'a raider you didn\'t see nearly catches you before you break away' },
        ],
      },
      {
        label: 'Read her body language from a distance instead (Insight)',
        actor: 'pc1',
        ability: 'WIS',
        skill: 'Insight',
        dc: 14,
        successNext: 'act2-eavesdrop-won',
        failureNext: 'act2-eavesdrop-lost',
        successEffects: [
          { type: 'setFlag', flag: 'eavesdropDone' },
          { type: 'setFlag', flag: 'umbraskLoreLearned' },
          { type: 'grantGold', amount: 8 },
        ],
        failureEffects: [{ type: 'setFlag', flag: 'eavesdropDone' }],
      },
    ],
  },
  'act2-eavesdrop-won': {
    type: 'narration',
    id: 'act2-eavesdrop-won',
    narration:
      'What you learn changes the shape of everything: the Cinderseal isn\'t the prize, it\'s one piece of one. Somewhere ' +
      'deeper in the Thornwood is a place called the Umbral Scar, and Umbrask — whatever Umbrask is — only wakes once all ' +
      'three seals are brought there. This camp is a waypoint. Not the destination.',
    choices: [{ label: 'Head back to cover, shaken', next: 'act2-hub' }],
  },
  'act2-eavesdrop-lost': {
    type: 'narration',
    id: 'act2-eavesdrop-lost',
    narration:
      'You catch fragments — "the Scar," "not the last one," a name that might be a place — but nothing whole enough to ' +
      'be sure of. Whatever Vesh is planning, most of it stays her secret for now.',
    choices: [{ label: 'Head back to cover', next: 'act2-hub' }],
  },

  // ========================================================================
  // Infiltration
  // ========================================================================
  'act2-infiltrate-choice': {
    type: 'narration',
    id: 'act2-infiltrate-choice',
    narration:
      'Sella is still in the cage at the camp\'s heart, and the Cinderseal is somewhere in Vesh\'s tent — that much you\'re ' +
      'certain of. The question now is how you go in.',
    choices: [
      { label: 'Slip in quietly and get her out before anyone notices', next: 'act2-infiltrate-stealth' },
      { label: 'Create a loud distraction and move while they\'re looking elsewhere', next: 'act2-infiltrate-frontal' },
    ],
  },
  'act2-infiltrate-stealth': {
    type: 'encounter',
    id: 'act2-infiltrate-stealth',
    narration:
      'You go in low and slow, threading between tents and firelight, the cage — and Sella — just ahead.',
    monster: { name: 'Camp Sentries', description: 'Alert, but not expecting anyone this deep already.', ac: 14, hp: 12 },
    choices: [
      {
        label: 'Stay to the shadows the whole way (Stealth)',
        actor: 'pc2',
        ability: 'DEX',
        skill: 'Stealth',
        dc: 15,
        successNext: 'act2-infiltrate-stealth-won',
        failureNext: 'act2-infiltrate-stealth-lost',
        successEffects: [{ type: 'setFlag', flag: 'infiltratedClean' }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc2', delta: -3, reason: 'a sentry\'s spear catches you before you can break contact' }],
      },
      {
        label: 'Bluff your way past as camp runners (Deception)',
        actor: 'companion1',
        ability: 'CHA',
        skill: 'Deception',
        dc: 15,
        successNext: 'act2-infiltrate-stealth-won',
        failureNext: 'act2-infiltrate-stealth-lost',
        successEffects: [{ type: 'grantGold', amount: 8 }],
        failureEffects: [{ type: 'hitPointChange', target: 'companion1', delta: -3, reason: 'the bluff falls apart and a sentry gets a hit in before you break away' }],
      },
    ],
  },
  'act2-infiltrate-stealth-won': {
    type: 'narration',
    id: 'act2-infiltrate-stealth-won',
    narration:
      'You reach the cage without a single raised voice. Sella looks up, exhausted but sharp-eyed, and doesn\'t waste ' +
      'breath on questions — she just reaches for the cage bars, ready to move the moment you get her free.',
    choices: [{ label: 'Free her', next: 'act2-find-sella' }],
  },
  'act2-infiltrate-stealth-lost': {
    type: 'narration',
    id: 'act2-infiltrate-stealth-lost',
    narration:
      'It goes sideways halfway across camp — not a full alarm, but enough that eyes are turning your way. You push on ' +
      'toward the cage regardless, faster now, quiet no longer an option.',
    choices: [{ label: 'Reach the cage', next: 'act2-find-sella' }],
  },
  'act2-infiltrate-frontal': {
    type: 'encounter',
    id: 'act2-infiltrate-frontal',
    narration:
      'You need noise, and you need it somewhere far from the cage — the horse line, maybe, or the fire itself. ' +
      'Something loud enough to pull every eye in camp the wrong direction.',
    monster: { name: 'The Camp, Alerted', description: 'Every sentry now looking somewhere — the question is where.', ac: 13, hp: 10 },
    choices: [
      {
        label: 'Spook the horse line loose (Animal Handling)',
        actor: 'companion2',
        ability: 'WIS',
        skill: 'Animal Handling',
        dc: 14,
        successNext: 'act2-infiltrate-frontal-won',
        failureNext: 'act2-infiltrate-frontal-lost',
        successEffects: [{ type: 'setFlag', flag: 'chaosAtCamp' }],
        failureEffects: [{ type: 'hitPointChange', target: 'companion2', delta: -3, reason: 'a spooked horse very nearly tramples you on its way past' }],
      },
      {
        label: 'Set the feed store alight and let the smoke do the rest (Sleight of Hand)',
        actor: 'pc1',
        ability: 'DEX',
        skill: 'Sleight of Hand',
        dc: 14,
        successNext: 'act2-infiltrate-frontal-won',
        failureNext: 'act2-infiltrate-frontal-lost',
        successEffects: [{ type: 'grantGold', amount: 8 }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -3, reason: 'the fire catches faster than planned and singes you badly getting clear' }],
      },
    ],
  },
  'act2-infiltrate-frontal-won': {
    type: 'narration',
    id: 'act2-infiltrate-frontal-won',
    narration:
      'It works better than you dared hope — half the camp is chasing horses or fighting the smoke, and no one is ' +
      'watching the cage at all. You reach Sella at a dead run.',
    choices: [{ label: 'Free her', next: 'act2-find-sella' }],
  },
  'act2-infiltrate-frontal-lost': {
    type: 'narration',
    id: 'act2-infiltrate-frontal-lost',
    narration:
      'It draws attention, just not cleanly enough — some of it swings back toward you instead of away. You reach the ' +
      'cage anyway, just with company on the way.',
    choices: [{ label: 'Reach the cage', next: 'act2-find-sella' }],
  },

  'act2-find-sella': {
    type: 'encounter',
    id: 'act2-find-sella',
    narration:
      'The cage lock is crude but stubborn, and Sella\'s hands are shaking too badly with cold and exhaustion to help. ' +
      'Somewhere behind you, the camp is starting to realize something is very wrong.',
    monster: { name: "Sella's Cage", description: 'Green-wood stakes and an iron lock — the last thing standing between her and freedom.', ac: 11, hp: 0 },
    choices: [
      {
        label: 'Force the lock before anyone arrives (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 13,
        successNext: 'act2-find-sella-won',
        failureNext: 'act2-find-sella-lost',
        successEffects: [{ type: 'setFlag', flag: 'sellaFreedClean' }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -3, reason: 'the lock finally breaks, but not before someone rounds the tent behind you' }],
      },
      {
        label: 'Pick it clean and fast (Sleight of Hand)',
        actor: 'pc2',
        ability: 'DEX',
        skill: 'Sleight of Hand',
        dc: 13,
        successNext: 'act2-find-sella-won',
        failureNext: 'act2-find-sella-lost',
        successEffects: [{ type: 'grantItem', item: { id: 'cinderseal-fragment', name: 'A Warm, Ash-Grey Stone', description: "Sella presses this into your hand the moment she's free — \"Keep this closer than the rest,\" she says, \"it's mine to carry, not theirs.\"" } }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc2', delta: -3, reason: 'the lock resists just long enough for a raider to close in' }],
      },
    ],
  },
  'act2-find-sella-won': {
    type: 'narration',
    id: 'act2-find-sella-won',
    narration:
      'Sella comes free cleanly and immediately grabs your arm. "The seal — it\'s in her tent, she never lets it out of ' +
      'her sight." Behind her, a familiar unhurried figure steps into the firelight. Vesh has finally noticed you.',
    choices: [{ label: 'Face her', next: 'act2-vesh-confront' }],
  },
  'act2-find-sella-lost': {
    type: 'narration',
    id: 'act2-find-sella-lost',
    narration:
      'Sella comes free, but not quietly, and not quickly enough — a familiar unhurried figure is already stepping into ' +
      'the firelight, unbothered by the chaos around her. Vesh has finally noticed you.',
    choices: [{ label: 'Face her', next: 'act2-vesh-confront' }],
  },

  'act2-vesh-confront': {
    type: 'encounter',
    id: 'act2-vesh-confront',
    narration:
      'Up close, Vesh is unremarkable in every way except her calm — no fear, no anger, just the mild inconvenience of ' +
      'people who weren\'t supposed to get this far. "You should have stayed in your burned little town," she says, and ' +
      'draws a blade the color of cooled ash.',
    monster: { name: "Vesh, the Ashen Circle's Captain", description: 'Unhurried, dangerous, and utterly certain she will win this.', ac: 15, hp: 28 },
    choices: [
      {
        label: 'Meet her blade for blade (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 15,
        successNext: 'act2-vesh-won',
        failureNext: 'act2-vesh-lost',
        successEffects: [
          { type: 'grantItem', item: { id: 'vesh-ashblade', name: "Vesh's Ashblade", description: 'The captain\'s own weapon, dropped as she broke off — cool to the touch no matter how long you hold it.' } },
          { type: 'alignmentShift', target: 'pc1', ethicalDelta: -5, reason: 'you drove Vesh off by force rather than words or cunning' },
        ],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -6, reason: 'she is faster than she looks, and it costs you' }],
      },
      {
        label: 'Outmaneuver her and force a retreat (DEX)',
        actor: 'pc2',
        ability: 'DEX',
        dc: 15,
        successNext: 'act2-vesh-won',
        failureNext: 'act2-vesh-lost',
        successEffects: [
          { type: 'setFlag', flag: 'veshRetreatedTactically' },
          { type: 'grantGold', amount: 20 },
        ],
        failureEffects: [{ type: 'hitPointChange', target: 'pc2', delta: -6, reason: 'she reads your footwork and turns it against you' }],
      },
    ],
  },
  'act2-vesh-won': {
    type: 'narration',
    id: 'act2-vesh-won',
    narration:
      'She breaks off rather than lose everything here — a tactical retreat, not a surrender, melting back into the ' +
      'smoke and confusion with a last look that promises this isn\'t finished. But the Cinderseal is yours, Sella is ' +
      'free, and the camp is falling apart behind you. It\'s enough, for tonight.',
    choices: [{ label: 'Get everyone clear of the camp', next: 'act2-milestone' }],
  },
  'act2-vesh-lost': {
    type: 'narration',
    id: 'act2-vesh-lost',
    narration:
      'She\'s better than any of you, and she makes sure you know it — but she\'s also outnumbered in a camp coming apart ' +
      'at the seams, and she chooses the smarter fight to walk away from. You\'re bruised and shaken, but the Cinderseal ' +
      'is in Sella\'s hands again, and that\'s what you came for.',
    choices: [
      {
        label: 'Get everyone clear of the camp',
        next: 'act2-milestone',
        effects: [{ type: 'hitPointChange', target: 'party', delta: -2, reason: 'the fighting retreat costs everyone something' }],
      },
    ],
  },

  // ========================================================================
  // Milestone and departure
  // ========================================================================
  'act2-milestone': {
    type: 'narration',
    id: 'act2-milestone',
    narration:
      'You put real distance between yourselves and the camp before anyone stops to breathe. Sella is alive. The ' +
      'Cinderseal is recovered. And now you know it was never really about a relic guarding a sleepy river town at all.',
    choices: [
      {
        label: 'Rest, regroup, and hear what Sella has to say',
        next: 'act2-departure',
        effects: [{ type: 'levelUp', target: 'party' }],
      },
    ],
  },
  'act2-departure': {
    type: 'narration',
    id: 'act2-departure',
    narration:
      'By firelight, Sella finally tells you what three generations of her family were sworn to keep quiet: the ' +
      'Cinderseal is one of three wards laid over something called Umbrask at a place called the Umbral Scar, deep in ' +
      'the oldest part of the Thornwood. The Ashen Circle already means to go there — with or without this seal. ' +
      '"If they raise the other two anyway," Sella says quietly, "we\'d rather be there when it happens than not."',
    // Hands off directly into Act 3's opening scene (shared/src/campaign/act3.ts).
    // The three acts are merged into one Campaign graph in activeCampaign.ts, so
    // this cross-act reference resolves once all three are combined; graph
    // validation for the full merged campaign lives in campaign.test.ts.
    choices: [{ label: 'Set out for the Umbral Scar', next: 'act3-start' }],
  },
}
