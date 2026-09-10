import type { Campaign } from './types.js'

// Act 3: "The Umbral Scar" — an original story, concluding Acts 1-2 ("Ash
// Over Millhaven" and "Into the Thornwood"). Mirrors the pacing of a
// classic climactic final act: three approaches into hostile ground, a
// staging hub before the final push, a pivotal confrontation whose outcome
// genuinely forks the story, and a moral choice at the very end that
// determines which of the campaign's endings the party reaches. All
// original setting/names/content, no reused plot from any published module.
//
// Structure mirrors Acts 1-2's shape: three route choices into the Umbral
// Scar (each a two-layer encounter arc) converge on a staging point, then
// a four-spoke hub offers optional preparation before the party commits to
// disrupting the ritual. One hub spoke (sabotaging the ritual wards) gates
// a much easier approach at the climax — the clearest mechanical payoff yet
// for hub-spoke prep, following the pattern the Act 2 shortcut established.
// Failing to stop the ritual in time branches the story onto a genuinely
// different, darker path rather than just failing forward with a worse
// version of the same scene — the two branches (`act3-vesh-final` vs.
// `act3-umbrask-stirs`) lead toward different final confrontations. The
// last scene before each ending, `act3-vesh-choice`, is a pure narrative
// choice (no check) that decides Vesh's fate and, with it, which of the
// four EndingScenes the party reaches — the payoff for "3-4 distinct
// endings" the whole campaign was built toward. Full graph validation
// (this act plus Acts 1-2, once merged in activeCampaign.ts) lives in
// campaign.test.ts.
export const ACT3_SCENES: Campaign = {
  'act3-start': {
    type: 'narration',
    id: 'act3-start',
    narration:
      'The Thornwood thins into something older and stranger — twisted, ash-pale trees ringing a sunken hollow where the ' +
      'ground itself seems to hold its breath. This is the Umbral Scar. Firelight and chanting drift up from somewhere ' +
      'below, and three ways lead down into it: a causeway of cracked, rune-carved stone, a sheer run of cliff paths, ' +
      'or the ritual procession\'s own trampled trail, wide open and unguarded-looking.',
    choices: [
      { label: 'Take the old causeway — it looks deliberate, built for this', next: 'act3-causeway' },
      { label: 'Descend the cliff paths and stay off the beaten track', next: 'act3-cliffs' },
      { label: "Follow the procession's own trail in, openly", next: 'act3-open-trail' },
    ],
  },

  // ========================================================================
  // Route A: the causeway
  // ========================================================================
  'act3-causeway': {
    type: 'encounter',
    id: 'act3-causeway',
    narration:
      'The causeway\'s stones are carved with wards older than the Ashen Circle, most of them cracked or deliberately ' +
      'defaced. Whoever built this meant to keep something in — or keep something out — and the difference matters more ' +
      'than you\'d like right now.',
    monster: { name: 'The Warded Causeway', description: 'Not a creature — old magic, half-broken, unpredictable underfoot.', ac: 13, hp: 0 },
    choices: [
      {
        label: 'Read the surviving wards and step only where it\'s safe (Arcana)',
        actor: 'pc2',
        ability: 'INT',
        skill: 'Arcana',
        dc: 14,
        successNext: 'act3-causeway-won',
        failureNext: 'act3-causeway-lost',
        successEffects: [{ type: 'setFlag', flag: 'readTheWards' }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc2', delta: -3, reason: 'a defaced ward flares and scorches your boots' }],
      },
      {
        label: 'Trust your footing over your knowledge of magic (DEX)',
        actor: 'pc1',
        ability: 'DEX',
        skill: 'Acrobatics',
        dc: 14,
        successNext: 'act3-causeway-won',
        failureNext: 'act3-causeway-lost',
        successEffects: [{ type: 'grantGold', amount: 8 }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -3, reason: 'a stone gives way underfoot' }],
      },
    ],
  },
  'act3-causeway-won': {
    type: 'narration',
    id: 'act3-causeway-won',
    narration:
      'You cross clean, the old wards recognizing something in your care that they don\'t in the Ashen Circle\'s. At the ' +
      'far end, stone shifts that shouldn\'t — something is waking to challenge whoever crosses uninvited, and you\'ve ' +
      'just been noticed.',
    choices: [{ label: 'Stand your ground', next: 'act3-causeway-guardian' }],
  },
  'act3-causeway-lost': {
    type: 'narration',
    id: 'act3-causeway-lost',
    narration:
      'You make it across bruised and singed rather than gracefully — and at the far end, stone shifts that shouldn\'t. ' +
      'Something old is waking to challenge whoever crosses uninvited.',
    choices: [{ label: 'Stand your ground', next: 'act3-causeway-guardian' }],
  },
  'act3-causeway-guardian': {
    type: 'encounter',
    id: 'act3-causeway-guardian',
    narration:
      'A Scar Warden rises from the causeway itself — root and stone fused into something vaguely person-shaped, old ' +
      'beyond guessing, moving with the patience of a thing that has done this before and will do it again after you\'re gone.',
    monster: { name: 'Scar Warden', description: 'An ancient root-and-stone guardian bound to the causeway, slow but relentless.', ac: 15, hp: 22 },
    choices: [
      {
        label: 'Break its footing before it breaks yours (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 15,
        successNext: 'act3-causeway-guardian-won',
        failureNext: 'act3-causeway-guardian-lost',
        successEffects: [{ type: 'grantItem', item: { id: 'warden-root', name: 'A Warden\'s Living Root', description: 'A fragment of the guardian, still faintly warm — it seems to want to grow toward you.' } }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -5, reason: 'a stone fist catches your shoulder' }],
      },
      {
        label: 'Show it the ward-marks you carry and hope it recognizes them (Religion)',
        actor: 'companion2',
        ability: 'INT',
        skill: 'Religion',
        dc: 15,
        successNext: 'act3-causeway-guardian-won',
        failureNext: 'act3-causeway-guardian-lost',
        successEffects: [{ type: 'alignmentShift', target: 'party', ethicalDelta: 5, reason: 'you found a way past an ancient guardian without destroying it' }],
        failureEffects: [{ type: 'hitPointChange', target: 'companion2', delta: -4, reason: 'it isn\'t convinced, and answers with a fist of stone' }],
      },
    ],
  },
  'act3-causeway-guardian-won': {
    type: 'narration',
    id: 'act3-causeway-guardian-won',
    narration:
      'The Warden settles back into stillness, its purpose apparently satisfied — or its patience simply outlasted. ' +
      'Ahead, the hollow opens below, firelight and chanting louder now, unmistakably close.',
    choices: [{ label: 'Continue down into the Scar', next: 'act3-scar-approach' }],
  },
  'act3-causeway-guardian-lost': {
    type: 'narration',
    id: 'act3-causeway-guardian-lost',
    narration:
      'It finally stills, whether from your efforts or its own old, slow logic, and lets you pass. Ahead, the hollow ' +
      'opens below, firelight and chanting louder now, unmistakably close.',
    choices: [{ label: 'Continue down into the Scar', next: 'act3-scar-approach' }],
  },

  // ========================================================================
  // Route B: the cliff paths
  // ========================================================================
  'act3-cliffs': {
    type: 'encounter',
    id: 'act3-cliffs',
    narration:
      'The cliff paths are barely paths at all — narrow ledges switching back down a sheer drop, chosen for being ' +
      'unwatched rather than being safe.',
    monster: { name: 'The Cliff Paths', description: 'Not a creature — a long, exposed drop and very little room for error.', ac: 12, hp: 0 },
    choices: [
      {
        label: 'Descend quickly before anyone looks up (DEX)',
        actor: 'companion1',
        ability: 'DEX',
        skill: 'Acrobatics',
        dc: 14,
        successNext: 'act3-cliffs-won',
        failureNext: 'act3-cliffs-lost',
        successEffects: [{ type: 'setFlag', flag: 'stayedUnseen' }],
        failureEffects: [{ type: 'hitPointChange', target: 'companion1', delta: -4, reason: 'a slip costs you a hard scrape down bare rock' }],
      },
      {
        label: 'Move as one, roped and deliberate (STR)',
        actor: 'pc1',
        ability: 'STR',
        skill: 'Athletics',
        dc: 14,
        successNext: 'act3-cliffs-won',
        failureNext: 'act3-cliffs-lost',
        successEffects: [{ type: 'grantGold', amount: 8 }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -4, reason: 'the rope holds, but not before a rough fall' }],
      },
    ],
  },
  'act3-cliffs-won': {
    type: 'narration',
    id: 'act3-cliffs-won',
    narration:
      'You reach the bottom unnoticed and ahead of schedule — but the quiet doesn\'t last. Voices below: an Ashen ' +
      'Vanguard patrol, sweeping the cliff base for exactly the kind of intrusion you just made.',
    choices: [{ label: 'Deal with them before they raise the alarm', next: 'act3-cliffs-ambush' }],
  },
  'act3-cliffs-lost': {
    type: 'narration',
    id: 'act3-cliffs-lost',
    narration:
      'You reach the bottom shaken and bruised, and the noise of the fall hasn\'t gone unnoticed — an Ashen Vanguard ' +
      'patrol is already moving to investigate.',
    choices: [{ label: 'Deal with them before they raise the alarm', next: 'act3-cliffs-ambush' }],
  },
  'act3-cliffs-ambush': {
    type: 'encounter',
    id: 'act3-cliffs-ambush',
    narration:
      'The Vanguard are the Ashen Circle\'s best — disciplined, quiet, clearly expecting trouble tonight. There\'s no ' +
      'talking your way past this one.',
    monster: { name: 'Ashen Vanguard', description: "The Circle's elite, disciplined and expecting exactly this kind of intrusion.", ac: 15, hp: 20 },
    choices: [
      {
        label: 'Strike first and fast, before they can call for help (DEX)',
        actor: 'pc2',
        ability: 'DEX',
        dc: 15,
        successNext: 'act3-cliffs-ambush-won',
        failureNext: 'act3-cliffs-ambush-lost',
        successEffects: [{ type: 'grantItem', item: { id: 'vanguard-cloak', name: 'Ashen Vanguard Cloak', description: 'Good enough to pass a distracted glance at a distance.' } }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc2', delta: -5, reason: 'they were faster than you gave them credit for' }],
      },
      {
        label: 'Fight them at close quarters, no room to maneuver (STR)',
        actor: 'companion1',
        ability: 'STR',
        dc: 15,
        successNext: 'act3-cliffs-ambush-won',
        failureNext: 'act3-cliffs-ambush-lost',
        successEffects: [{ type: 'grantGold', amount: 10 }],
        failureEffects: [{ type: 'hitPointChange', target: 'companion1', delta: -5, reason: 'a hard exchange leaves you bloodied' }],
      },
    ],
  },
  'act3-cliffs-ambush-won': {
    type: 'narration',
    id: 'act3-cliffs-ambush-won',
    narration:
      'They go down before a single alarm is raised. Ahead, the hollow opens below, firelight and chanting louder now, ' +
      'unmistakably close.',
    choices: [{ label: 'Continue down into the Scar', next: 'act3-scar-approach' }],
  },
  'act3-cliffs-ambush-lost': {
    type: 'narration',
    id: 'act3-cliffs-ambush-lost',
    narration:
      'You win through, but it\'s ugly, and loud enough that you can\'t be sure no one heard. Ahead, the hollow opens ' +
      'below, firelight and chanting louder now, unmistakably close.',
    choices: [{ label: 'Continue down into the Scar', next: 'act3-scar-approach' }],
  },

  // ========================================================================
  // Route C: the open trail
  // ========================================================================
  'act3-open-trail': {
    type: 'encounter',
    id: 'act3-open-trail',
    narration:
      'The procession\'s own trail is wide, obvious, and almost certainly watched — which is exactly why walking it ' +
      'openly, as though you belong, might work better than sneaking ever could.',
    monster: { name: 'Circle Sentries', description: 'Watching the open trail for exactly this kind of bluff.', ac: 13, hp: 10 },
    choices: [
      {
        label: 'Walk in like you were summoned (Deception)',
        actor: 'companion1',
        ability: 'CHA',
        skill: 'Deception',
        dc: 15,
        successNext: 'act3-open-trail-won',
        failureNext: 'act3-open-trail-lost',
        successEffects: [{ type: 'setFlag', flag: 'bluffedTheTrail' }],
        failureEffects: [{ type: 'hitPointChange', target: 'companion1', delta: -3, reason: 'the bluff nearly gets you skewered before you break away' }],
      },
      {
        label: 'Wear down their nerve instead of their trust (Intimidation)',
        actor: 'pc1',
        ability: 'CHA',
        skill: 'Intimidation',
        dc: 15,
        successNext: 'act3-open-trail-won',
        failureNext: 'act3-open-trail-lost',
        successEffects: [{ type: 'grantGold', amount: 8 }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -3, reason: 'they call your bluff and come at you together' }],
      },
    ],
  },
  'act3-open-trail-won': {
    type: 'narration',
    id: 'act3-open-trail-won',
    narration:
      'It works better than it should have — you walk the whole trail without a single blade drawn. Near the bottom, ' +
      'though, a lone Circle initiate blocks the path, eyes wide, clearly less certain of all this than her companions.',
    choices: [{ label: 'See what she wants', next: 'act3-open-trail-standoff' }],
  },
  'act3-open-trail-lost': {
    type: 'narration',
    id: 'act3-open-trail-lost',
    narration:
      'It falls apart halfway down, and you have to fight clear of it — messier than planned, but you\'re through. Near ' +
      'the bottom, a lone Circle initiate blocks the path, hands shaking, clearly less certain of all this than her companions.',
    choices: [{ label: 'See what she wants', next: 'act3-open-trail-standoff' }],
  },
  'act3-open-trail-standoff': {
    type: 'encounter',
    id: 'act3-open-trail-standoff',
    narration:
      'She doesn\'t draw a weapon. "You shouldn\'t be here," she says, voice unsteady, "but neither should any of us. ' +
      'Not for this." Whether that\'s an opening or a trap depends on how you read her.',
    monster: { name: 'A Hesitant Initiate', description: 'Young, frightened, and possibly more useful alive than fought.', ac: 11, hp: 6 },
    choices: [
      {
        label: 'Read her sincerity before deciding anything (Insight)',
        actor: 'pc2',
        ability: 'WIS',
        skill: 'Insight',
        dc: 13,
        successNext: 'act3-open-trail-standoff-won',
        failureNext: 'act3-open-trail-standoff-lost',
        successEffects: [
          { type: 'setFlag', flag: 'metMeva' },
          { type: 'alignmentShift', target: 'party', moralDelta: 5, reason: 'you chose to trust someone who could have been a trap, and weren\'t wrong' },
        ],
      },
      {
        label: 'Press past her before she can decide to call out (DEX)',
        actor: 'companion2',
        ability: 'DEX',
        dc: 13,
        successNext: 'act3-open-trail-standoff-won',
        failureNext: 'act3-open-trail-standoff-lost',
        successEffects: [{ type: 'grantGold', amount: 8 }],
        failureEffects: [{ type: 'hitPointChange', target: 'companion2', delta: -3, reason: 'she panics and the noise draws unwanted attention' }],
      },
    ],
  },
  'act3-open-trail-standoff-won': {
    type: 'narration',
    id: 'act3-open-trail-standoff-won',
    narration:
      'Her name is Meva, and she\'s been looking for a reason to walk away from the Ashen Circle for weeks. She won\'t ' +
      'fight for you openly — not yet — but she points you toward the hollow\'s edge and disappears before anyone sees ' +
      'her talking to you.',
    choices: [{ label: 'Continue down into the Scar', next: 'act3-scar-approach' }],
  },
  'act3-open-trail-standoff-lost': {
    type: 'narration',
    id: 'act3-open-trail-standoff-lost',
    narration:
      'She bolts before anything is resolved, shouting isn\'t your problem yet but might become one. You press on into ' +
      'the hollow regardless.',
    choices: [{ label: 'Continue down into the Scar', next: 'act3-scar-approach' }],
  },

  // ========================================================================
  // Convergence and staging hub
  // ========================================================================
  'act3-scar-approach': {
    type: 'narration',
    id: 'act3-scar-approach',
    narration:
      'The Umbral Scar opens below you in full: a sunken ring of blackened stone, the Ashen Circle gathered around a ' +
      'circle of braziers and three waiting cradles — one already holding the Cinderseal, two empty no longer, filled ' +
      'with wards you\'ve never seen. At the center, the ground itself seems to have a shape beneath it, vast and ' +
      'sleeping. Vesh stands closest to the fire, watching the sky as though counting down to something.',
    choices: [{ label: 'Take stock before committing to anything', next: 'act3-hub' }],
  },

  'act3-hub': {
    type: 'narration',
    id: 'act3-hub',
    narration:
      'The ritual hasn\'t begun in earnest yet — there\'s still time to shape how this goes, but not much of it.',
    choices: [
      {
        label: 'Scout the ritual site for a way in',
        next: 'act3-scout-ritual',
        condition: { flag: 'scoutRitualDone', equals: false },
      },
      {
        label: 'Free the conscripted laborers chained near the braziers',
        next: 'act3-free-captives',
        condition: { flag: 'freeCaptivesDone', equals: false },
      },
      {
        label: 'Sabotage the ritual wards before they can be completed',
        next: 'act3-sabotage-wards',
        condition: { flag: 'sabotageWardsDone', equals: false },
      },
      {
        label: 'Find Meva and see if she\'ll help',
        next: 'act3-meva',
        condition: { flag: 'metMeva' },
      },
      { label: 'Move now — stop the ritual before it completes', next: 'act3-ritual-confront-approach' },
    ],
  },

  // --- Hub spoke: scout the ritual site ---
  'act3-scout-ritual': {
    type: 'encounter',
    id: 'act3-scout-ritual',
    narration:
      'From the hollow\'s rim, you try to map the ritual itself — how many braziers, how many guards, and most of all, ' +
      'how long before the three seals are actually seated.',
    monster: { name: 'The Ritual Site', description: 'Not a fight — a layout to read correctly before you commit to anything.', ac: 12, hp: 0 },
    choices: [
      {
        label: 'Read the ritual\'s shape and timing (Arcana)',
        actor: 'pc2',
        ability: 'INT',
        skill: 'Arcana',
        dc: 14,
        successNext: 'act3-scout-ritual-won',
        failureNext: 'act3-scout-ritual-lost',
        successEffects: [
          { type: 'setFlag', flag: 'scoutRitualDone' },
          { type: 'setFlag', flag: 'knowsRitualTiming' },
          { type: 'grantGold', amount: 10 },
        ],
        failureEffects: [{ type: 'setFlag', flag: 'scoutRitualDone' }],
      },
      {
        label: 'Count guards and mark the quietest approach (Perception)',
        actor: 'companion2',
        ability: 'WIS',
        skill: 'Perception',
        dc: 13,
        successNext: 'act3-scout-ritual-won',
        failureNext: 'act3-scout-ritual-lost',
        successEffects: [
          { type: 'setFlag', flag: 'scoutRitualDone' },
          { type: 'setFlag', flag: 'knowsRitualTiming' },
        ],
        failureEffects: [{ type: 'setFlag', flag: 'scoutRitualDone' }],
      },
    ],
  },
  'act3-scout-ritual-won': {
    type: 'narration',
    id: 'act3-scout-ritual-won',
    narration:
      'You come away with a real picture: the third seal isn\'t seated yet, and won\'t be for a while — you have a ' +
      'genuine window, not just a hope.',
    choices: [{ label: 'Return to cover', next: 'act3-hub' }],
  },
  'act3-scout-ritual-lost': {
    type: 'narration',
    id: 'act3-scout-ritual-lost',
    narration:
      'The ritual\'s rhythm is harder to read from a distance than you\'d hoped — you come away with only guesses about ' +
      'how much time is really left.',
    choices: [{ label: 'Return to cover', next: 'act3-hub' }],
  },

  // --- Hub spoke: free the captives ---
  'act3-free-captives': {
    type: 'encounter',
    id: 'act3-free-captives',
    narration:
      'Chained near the braziers, hauling fuel and stone at spearpoint, are a dozen conscripted laborers — and with a ' +
      'jolt, you recognize two of them from Millhaven, taken the night of the raid and never accounted for since.',
    monster: { name: 'Brazier Guards', description: 'Watching the laborers more out of habit than real vigilance.', ac: 12, hp: 10 },
    choices: [
      {
        label: 'Cut them loose and get them clear, guards or no (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 14,
        successNext: 'act3-free-captives-won',
        failureNext: 'act3-free-captives-lost',
        successEffects: [
          { type: 'setFlag', flag: 'freeCaptivesDone' },
          { type: 'setFlag', flag: 'millhavenCaptivesFreed' },
          { type: 'alignmentShift', target: 'party', moralDelta: 10, reason: 'you freed a dozen people the Ashen Circle meant to work to death' },
        ],
        failureEffects: [
          { type: 'setFlag', flag: 'freeCaptivesDone' },
          { type: 'hitPointChange', target: 'pc1', delta: -4, reason: 'the guards notice before you\'re done and you have to fight clear' },
        ],
      },
      {
        label: 'Slip in unseen and free them quietly (Stealth)',
        actor: 'companion1',
        ability: 'DEX',
        skill: 'Stealth',
        dc: 14,
        successNext: 'act3-free-captives-won',
        failureNext: 'act3-free-captives-lost',
        successEffects: [
          { type: 'setFlag', flag: 'freeCaptivesDone' },
          { type: 'setFlag', flag: 'millhavenCaptivesFreed' },
          { type: 'grantItem', item: { id: 'carrow-token', name: "A Carved Wooden Bird", description: "One of the freed laborers presses this into your hand — you recognize it. It's a twin to the charm Pell Carrow gave you, back in Millhaven." } },
        ],
        failureEffects: [
          { type: 'setFlag', flag: 'freeCaptivesDone' },
          { type: 'grantCurse', target: 'random', curse: { id: 'brazierscar', name: 'Brazier Scar', description: 'A guard\'s torch caught you freeing the captives — fire near you now burns a little hotter, a little less predictably.' } },
        ],
      },
    ],
  },
  'act3-free-captives-won': {
    type: 'narration',
    id: 'act3-free-captives-won',
    narration:
      'They scatter into the dark the moment they\'re loose, and among the last out, one of the Millhaven captives grips ' +
      'your arm. "Vesh doesn\'t want this," she whispers. "Not really. Watch her, when it starts." Then she\'s gone.',
    choices: [{ label: 'Return to cover', next: 'act3-hub' }],
  },
  'act3-free-captives-lost': {
    type: 'narration',
    id: 'act3-free-captives-lost',
    narration:
      'It goes loud, but they get clear regardless, scattering in every direction while the guards are still working out ' +
      'what happened. It\'s messy. It\'s also done.',
    choices: [{ label: 'Return to cover', next: 'act3-hub' }],
  },

  // --- Hub spoke: sabotage the wards ---
  'act3-sabotage-wards': {
    type: 'encounter',
    id: 'act3-sabotage-wards',
    narration:
      'The three cradles sit close enough to reach if you\'re careful — and the wards being carved into their bases are ' +
      'clearly unfinished. Disrupting them now, before they\'re sealed, would matter enormously later.',
    monster: { name: 'The Unfinished Wards', description: 'Delicate, incomplete, and watched — a small window before they\'re guarded properly.', ac: 14, hp: 0 },
    choices: [
      {
        label: 'Corrupt the ward-carving with a counter-mark of your own (Arcana)',
        actor: 'pc2',
        ability: 'INT',
        skill: 'Arcana',
        dc: 15,
        successNext: 'act3-sabotage-wards-won',
        failureNext: 'act3-sabotage-wards-lost',
        successEffects: [
          { type: 'setFlag', flag: 'sabotageWardsDone' },
          { type: 'setFlag', flag: 'wardsWeakened' },
          { type: 'grantGold', amount: 12 },
        ],
        failureEffects: [
          { type: 'setFlag', flag: 'sabotageWardsDone' },
          { type: 'grantCurse', target: 'random', curse: { id: 'wardfeedback', name: 'Ward Feedback', description: 'The half-formed ward lashed back as it failed — warded places now feel your presence before you arrive, which is rarely to your advantage.' } },
        ],
      },
      {
        label: 'Work fast and quiet, hands rather than knowledge (Sleight of Hand)',
        actor: 'companion1',
        ability: 'DEX',
        skill: 'Sleight of Hand',
        dc: 15,
        successNext: 'act3-sabotage-wards-won',
        failureNext: 'act3-sabotage-wards-lost',
        successEffects: [
          { type: 'setFlag', flag: 'sabotageWardsDone' },
          { type: 'setFlag', flag: 'wardsWeakened' },
        ],
        failureEffects: [{ type: 'setFlag', flag: 'sabotageWardsDone' }],
      },
    ],
  },
  'act3-sabotage-wards-won': {
    type: 'narration',
    id: 'act3-sabotage-wards-won',
    narration:
      'The counter-work is subtle enough that no one notices before you\'re clear — but it\'s real. Whatever the Ashen ' +
      'Circle finishes carving, it won\'t hold the way they think it will. When the moment comes to strike, that will matter.',
    choices: [{ label: 'Return to cover', next: 'act3-hub' }],
  },
  'act3-sabotage-wards-lost': {
    type: 'narration',
    id: 'act3-sabotage-wards-lost',
    narration:
      'You get close, but not close enough to do real damage before a guard\'s shadow forces you back. The wards stay ' +
      'intact — whatever happens next, you\'ll be doing it the hard way.',
    choices: [{ label: 'Return to cover', next: 'act3-hub' }],
  },

  // --- Hub spoke: Meva (only offered if met on the open-trail route) ---
  'act3-meva': {
    type: 'narration',
    id: 'act3-meva',
    narration:
      'You find Meva crouched behind a fallen brazier, still clearly torn between the only life she\'s known and ' +
      'whatever this is about to become. "I can\'t fight my own," she says quietly, "but I can tell you Vesh doesn\'t ' +
      'want this either. She\'s bound to the Circle\'s oath, not its cause. If you corner her — really corner her — she ' +
      'might listen before she fights."',
    choices: [
      {
        label: 'Take that as worth remembering',
        next: 'act3-hub',
        effects: [
          { type: 'setFlag', flag: 'knowsVeshDoubts' },
          { type: 'grantItem', item: { id: 'mevas-token', name: "Meva's Circle Sigil", description: 'A token she pressed on you — proof, she said, that not everyone here chose this freely.' } },
        ],
      },
    ],
  },

  // ========================================================================
  // The ritual confrontation — this is where the story genuinely forks
  // ========================================================================
  'act3-ritual-confront-approach': {
    type: 'narration',
    id: 'act3-ritual-confront-approach',
    narration:
      'Whatever else you\'ve learned or done here, the moment is now — the third seal is close to being seated, and once ' +
      'it is, nothing you do afterward will matter nearly as much as something you do right now.',
    choices: [{ label: 'Move on the ritual circle', next: 'act3-ritual-confront' }],
  },
  'act3-ritual-confront': {
    type: 'encounter',
    id: 'act3-ritual-confront',
    narration:
      'You break from cover toward the cradles, braziers throwing wild shadows, chanting rising around you into ' +
      'something with real weight behind it now. There is exactly one chance to stop this cleanly.',
    monster: { name: 'The Ritual Circle', description: 'Nearly complete — every second spent here is a second closer to too late.', ac: 15, hp: 0 },
    choices: [
      {
        label: 'Strike the ritual circle directly, all force, no finesse (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 16,
        successNext: 'act3-vesh-final',
        failureNext: 'act3-umbrask-stirs',
        successEffects: [{ type: 'setFlag', flag: 'ritualStopped' }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -6, reason: 'the backlash from a failed disruption hits you hard' }],
      },
      {
        label: 'Exploit the wards you already weakened (Arcana)',
        actor: 'pc2',
        ability: 'INT',
        skill: 'Arcana',
        dc: 12,
        successNext: 'act3-vesh-final',
        failureNext: 'act3-umbrask-stirs',
        successEffects: [
          { type: 'setFlag', flag: 'ritualStopped' },
          { type: 'grantGold', amount: 15 },
        ],
        failureEffects: [{ type: 'hitPointChange', target: 'pc2', delta: -6, reason: 'even weakened, the ward doesn\'t give without a fight' }],
        condition: { flag: 'wardsWeakened' },
      },
    ],
  },

  // --- Success branch: the ritual is stopped, leading to a final duel with Vesh ---
  'act3-vesh-final': {
    type: 'encounter',
    id: 'act3-vesh-final',
    narration:
      'The circle collapses in on itself, braziers guttering, chanting breaking into shouts of confusion — and Vesh is ' +
      'already moving toward you, blade drawn, expression unreadable. Whatever comes next, it\'s between you and her now.',
    monster: { name: "Vesh, Voice of the Ashen Circle", description: 'No longer unhurried — for the first time, she looks like she\'s truly fighting for something.', ac: 16, hp: 32 },
    choices: [
      {
        label: 'Press the advantage while the ritual\'s collapse still has her off balance (DEX)',
        actor: 'pc2',
        ability: 'DEX',
        dc: 16,
        successNext: 'act3-vesh-choice',
        failureNext: 'act3-vesh-choice',
        successEffects: [
          { type: 'setFlag', flag: 'veshOverpowered' },
          { type: 'grantItem', item: { id: 'ashen-circlet', name: 'The Ashen Circle\'s Seal of Office', description: "Knocked loose in the fight — whoever holds this, the Circle's remnants might listen to." } },
        ],
        failureEffects: [{ type: 'hitPointChange', target: 'pc2', delta: -6, reason: 'she recovers faster than you hoped and makes you pay for it' }],
      },
      {
        label: 'Meet her head-on and trust your steel (STR)',
        actor: 'companion1',
        ability: 'STR',
        dc: 16,
        successNext: 'act3-vesh-choice',
        failureNext: 'act3-vesh-choice',
        successEffects: [{ type: 'setFlag', flag: 'veshOverpowered' }],
        failureEffects: [{ type: 'hitPointChange', target: 'companion1', delta: -6, reason: 'she is every bit as dangerous as Millhaven feared' }],
      },
    ],
  },

  'act3-vesh-choice': {
    type: 'narration',
    id: 'act3-vesh-choice',
    narration:
      'Whichever way the fight went, it ends the same way: Vesh on the ground, disarmed, breathing hard, finally — ' +
      'finally — looking at you instead of past you. "Go on, then," she says, and there\'s no defiance left in it, just ' +
      'exhaustion. "Finish it. Or don\'t. I find I\'m no longer certain which I\'d choose, in your place."',
    choices: [
      {
        label: 'Strike her down — the Ashen Circle ends here, all the way through',
        next: 'act3-ending-bound',
        effects: [{ type: 'alignmentShift', target: 'party', ethicalDelta: -10, reason: 'you killed a defeated, surrendering enemy' }],
      },
      {
        label: 'Let her go — this is over, and she\'s no longer the one carrying it',
        next: 'act3-ending-spared',
        effects: [{ type: 'alignmentShift', target: 'party', moralDelta: 10, reason: 'you showed mercy to an enemy who had nothing left to bargain with' }],
      },
      {
        label: 'Hear her out first — something in her voice says this isn\'t finished',
        next: 'act3-vesh-bargain',
      },
    ],
  },

  'act3-vesh-bargain': {
    type: 'narration',
    id: 'act3-vesh-bargain',
    narration:
      '"The Circle dies with me tonight either way," she says. "But what it protected doesn\'t have to. Umbrask sleeps ' +
      'because three generations of people like Sella gave everything to keep it that way — not out of duty to some ' +
      'cause, but because it works. Take up that oath. Take the seals, take what\'s left of the Circle\'s knowledge, and ' +
      'finish what we started properly, without the cruelty. I\'ll kneel to that. I won\'t kneel to being executed for trying."',
    choices: [
      {
        label: 'Accept — take up the oath, on your own terms',
        next: 'act3-ending-circle',
      },
      {
        label: 'Refuse — this isn\'t a legacy worth carrying, however it started',
        next: 'act3-vesh-bargain-refused',
      },
    ],
  },
  'act3-vesh-bargain-refused': {
    type: 'narration',
    id: 'act3-vesh-bargain-refused',
    narration:
      '"No," you tell her, and mean it. Whatever the Ashen Circle became, however it started, it isn\'t yours to inherit. ' +
      'Vesh studies you for a long moment, then nods once, like she expected exactly this and is, somehow, relieved by it.',
    choices: [
      {
        label: 'Let her go',
        next: 'act3-ending-spared',
        effects: [{ type: 'alignmentShift', target: 'party', ethicalDelta: 8, reason: 'you refused a shortcut to power and freed her anyway' }],
      },
    ],
  },

  // --- Failure branch: the ritual completes, leading to a desperate fight instead ---
  'act3-umbrask-stirs': {
    type: 'narration',
    id: 'act3-umbrask-stirs',
    narration:
      'The third seal seats with a sound like the whole hollow inhaling — and the ground beneath the circle moves. Not ' +
      'an earthquake. A shoulder, shifting. Braziers gutter out all at once, and in the sudden dark, something vast made ' +
      'of root and ember opens an eye that has not opened in longer than Millhaven has had a name. Vesh, of all people, ' +
      'looks genuinely afraid for the first time.',
    choices: [{ label: 'Do something — anything', next: 'act3-vesh-desperate' }],
  },
  'act3-vesh-desperate': {
    type: 'encounter',
    id: 'act3-vesh-desperate',
    narration:
      'Vesh is shouting orders no one is following anymore, the Ashen Circle scattering as Umbrask stirs fully awake ' +
      'around them — and whatever chance remains to salvage this is measured in seconds, not choices.',
    monster: { name: 'Umbrask, Half-Waking', description: 'Vast, slow, and utterly beyond anything you have fought before — you cannot defeat this. You can only buy time.', ac: 15, hp: 40 },
    choices: [
      {
        label: 'Drag Vesh clear and force the last ward shut together (STR)',
        actor: 'companion1',
        ability: 'STR',
        dc: 15,
        successNext: 'act3-ending-wakes',
        failureNext: 'act3-ending-wakes',
        successEffects: [
          { type: 'setFlag', flag: 'umbraskContainedWell' },
          { type: 'grantItem', item: { id: 'scar-ember', name: 'A Cooling Ember of the Scar', description: 'Umbrask stirred, but did not fully wake — this ember is proof of how close it came.' } },
        ],
        failureEffects: [{ type: 'hitPointChange', target: 'party', delta: -6, reason: 'the ground itself fights you on the way out' }],
      },
      {
        label: 'Buy everyone time to run while the ward re-forms on its own (DEX)',
        actor: 'pc2',
        ability: 'DEX',
        dc: 15,
        successNext: 'act3-ending-wakes',
        failureNext: 'act3-ending-wakes',
        successEffects: [{ type: 'setFlag', flag: 'umbraskContainedWell' }],
        failureEffects: [{ type: 'hitPointChange', target: 'party', delta: -6, reason: 'you get everyone clear, but not gently' }],
      },
    ],
  },

  // ========================================================================
  // Endings
  // ========================================================================
  'act3-ending-bound': {
    type: 'ending',
    id: 'act3-ending-bound',
    title: 'Umbrask Bound Anew',
    narration:
      'The Umbral Scar falls silent for good. Vesh is dead, the Ashen Circle scattered and leaderless, and the three ' +
      'seals sit reunited in Sella\'s keeping — she reseals Umbrask herself, by torchlight, murmuring words her family ' +
      'has kept secret for three generations. It is a clean ending, the kind songs get written about. Whether it is ' +
      'also the ending you meant to choose, when this began outside a burning granary in Millhaven, is a question only ' +
      'you can answer. The road home is quiet. You have earned it, however it was bought.',
  },
  'act3-ending-spared': {
    type: 'ending',
    id: 'act3-ending-spared',
    title: 'The Circle Broken, the Captain Spared',
    narration:
      'Vesh walks away from the Umbral Scar alone, unarmed, and alive — where she goes after that is a story that ' +
      'doesn\'t belong to you anymore. The Ashen Circle is finished regardless: its cause scattered, its wards restored, ' +
      'Umbrask sleeping again under Sella\'s careful watch. Millhaven rebuilds. Rell finds his way back to the trade ' +
      'roads. Somewhere, perhaps, a former raider captain is deciding what to do with a second chance she never asked ' +
      'for and isn\'t sure she deserves. You did not need her death to finish this. That, in the end, is the whole of the ' +
      'victory — and it is enough.',
  },
  'act3-ending-circle': {
    type: 'ending',
    id: 'act3-ending-circle',
    title: "The Ashen Circle's New Voice",
    narration:
      'You take up what Vesh offered, and the Umbral Scar changes hands rather than closing for good — the seals ' +
      'restored, the wards renewed, but the Ashen Circle\'s old oath now answers to you instead of a name burned into ' +
      'leather. Millhaven never learns how close it came to something far worse, and perhaps that\'s its own kind of ' +
      'mercy. Sella asks no questions when you tell her Umbrask sleeps safely again. She doesn\'t entirely believe you. ' +
      'She also doesn\'t press. Whatever you\'ve become, carrying this forward, it started with a choice to trust an ' +
      'enemy\'s reasoning over your own doubts about it — and there is no undoing that now, only living with where it leads.',
  },
  'act3-ending-wakes': {
    type: 'ending',
    id: 'act3-ending-wakes',
    title: 'Umbrask Wakes',
    narration:
      'You do not stop the ritual in time. Umbrask does not fully wake — the last ward, forced shut at terrible cost, ' +
      'sees to that — but it stirs, and the Thornwood is never quite the same afterward: a low tremor that never fully ' +
      'settles, trees that grow the wrong way around the Scar\'s edge, travelers who report feeling watched from below ' +
      'the ground. Vesh survives, scattered along with the last of the Ashen Circle, her fate and theirs unresolved. ' +
      'Sella takes up permanent watch over the Scar, older and warier than before, and does not ask you to stay and ' +
      'share the burden. You go home to Millhaven with your lives, your levels, your gold and scars and curses earned ' +
      'along the way — and the quiet, permanent knowledge of exactly how close "not quite" came to being nowhere near ' +
      'close enough.',
  },
}
