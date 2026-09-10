import type { Campaign } from './types.js'

// Act 1: "Ash Over Millhaven" — an original story. Mirrors the pacing of a
// classic "settlement under threat" opening beat (a town is raided, the
// party repels or investigates the raid, a named NPC and a relic are
// taken, the party commits to pursuing the raiders) without reusing any
// specific plot, names, or content from any published module.
//
// Structure: three opening approaches (combat / stealth / rally), each a
// short multi-scene arc with its own complication, converge on a single
// aftermath scene. From there, a hub scene (`act1-hub`) offers up to four
// optional investigation "spokes" — each a short encounter that loops back
// to the hub, with a story flag hiding it once completed (the engine's
// SceneCondition gating, exercised here for the first time in real
// content) — before the party commits to leaving. The final scene,
// `act1-departure`, hands off directly to `act2-start` in act2.ts.
export const ACT1_SCENES: Campaign = {
  'act1-start': {
    type: 'narration',
    id: 'act1-start',
    narration:
      'Millhaven sleeps under a low harvest moon — grain towers dark against the sky, the river mill silent for the night. ' +
      'Then the bell in the square starts screaming, and torchlight blooms at the edge of town: riders in ash-grey cloaks, ' +
      'sigils burned into their leather, driving in from the tree line. Someone shouts that they are making straight for the granary. ' +
      'Someone else says they saw a rider peel off toward Old Sella\'s cottage, where the town keeps the Cinderseal — the ward-relic ' +
      'her family has guarded for three generations.',
    choices: [
      { label: 'Charge toward the granary and meet them head-on', next: 'act1-granary-fight' },
      { label: 'Slip along the rooftops to see who is giving the orders', next: 'act1-spy' },
      { label: 'Rally the town militia at the square first', next: 'act1-rally' },
    ],
  },

  // ========================================================================
  // Opening branch 1: the granary — fight, then a rescue complication
  // ========================================================================
  'act1-granary-fight': {
    type: 'encounter',
    id: 'act1-granary-fight',
    narration:
      'The granary is already burning at one corner, raiders forming a loose line between the flames and the grain stores. ' +
      'One raises a hooked blade toward you; another is feeding the fire with anything that will catch.',
    monster: { name: 'Ashen Raider', description: 'A cult skirmisher in soot-stained leather, moving like she expects to win.', ac: 13, hp: 15 },
    choices: [
      {
        label: 'Charge the raiders head-on (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 13,
        successNext: 'act1-granary-won',
        failureNext: 'act1-granary-lost',
        successEffects: [
          { type: 'grantItem', item: { id: 'ashblade', name: "Raider's Ashblade", description: 'A notched short sword, still warm from the fire.' } },
        ],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -5, reason: 'a hooked blade catches your side' }],
      },
      {
        label: 'Beat back the fire before it reaches the grain (DEX)',
        actor: 'companion1',
        ability: 'DEX',
        dc: 12,
        successNext: 'act1-granary-won',
        failureNext: 'act1-granary-lost',
        successEffects: [
          { type: 'grantGold', amount: 15 },
          { type: 'setFlag', flag: 'grainSaved' },
        ],
        failureEffects: [{ type: 'hitPointChange', target: 'companion1', delta: -3, reason: 'a collapsing beam sears an arm' }],
      },
    ],
  },
  'act1-granary-won': {
    type: 'narration',
    id: 'act1-granary-won',
    narration:
      'The raiders break off faster than they came, melting back toward the tree line — this was never meant to be a real fight, ' +
      'just cover. Over the crackle of the dying fire, you hear it: a child screaming from inside the granary\'s grain loft, ' +
      'the ladder down already burning.',
    choices: [{ label: "Go after the child", next: 'act1-granary-rescue' }],
  },
  'act1-granary-lost': {
    type: 'narration',
    id: 'act1-granary-lost',
    narration:
      'You hold the line, but it costs you — the raiders break off on their own terms, not yours. Through the smoke, you hear ' +
      'a child screaming from the grain loft above, the ladder down already burning.',
    choices: [{ label: "Go after the child", next: 'act1-granary-rescue' }],
  },
  'act1-granary-rescue': {
    type: 'encounter',
    id: 'act1-granary-rescue',
    narration:
      'The loft is Pell Carrow, the miller\'s boy, nine years old and wedged behind a fallen beam with smoke pooling ' +
      'at the rafters. He has maybe a minute before it isn\'t smoke he has to worry about.',
    monster: { name: 'Collapsing Granary', description: 'Not a creature — burning timber, failing fast.', ac: 12, hp: 0 },
    choices: [
      {
        label: 'Pry the beam free with brute strength (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 14,
        successNext: 'act1-granary-rescue-won',
        failureNext: 'act1-granary-rescue-lost',
        successEffects: [{ type: 'grantItem', item: { id: 'pells-charm', name: "Pell's Lucky Charm", description: 'A carved wooden bird, pressed into your hand by a grateful nine-year-old.' } }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -4, reason: 'the beam shifts wrong and the heat catches you' }],
      },
      {
        label: 'Squeeze through the gap to reach him (DEX)',
        actor: 'pc2',
        ability: 'DEX',
        skill: 'Acrobatics',
        dc: 13,
        successNext: 'act1-granary-rescue-won',
        failureNext: 'act1-granary-rescue-lost',
        successEffects: [{ type: 'setFlag', flag: 'pellSaved' }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc2', delta: -3, reason: 'a lungful of smoke and a scraped-raw arm' }],
      },
    ],
  },
  'act1-granary-rescue-won': {
    type: 'narration',
    id: 'act1-granary-rescue-won',
    narration:
      'You get him out seconds before the loft gives way behind you both. Pell doesn\'t stop shaking until his father has him ' +
      'in both arms, but he\'s whole. "Thank you," Dag Carrow says, and means it more than the words can carry.',
    choices: [{ label: 'Catch your breath and regroup', next: 'act1-raiders-retreat' }],
  },
  'act1-granary-rescue-lost': {
    type: 'narration',
    id: 'act1-granary-rescue-lost',
    narration:
      'You get him out, but not cleanly — a fall, a bad landing, a scream that isn\'t his. Pell will live; whether his leg ' +
      'heals straight is a question for someone with better hands than yours tonight.',
    choices: [{ label: 'Catch your breath and regroup', next: 'act1-raiders-retreat' }],
  },

  // ========================================================================
  // Opening branch 2: the rooftops — spy, then a choice to shadow further
  // ========================================================================
  'act1-spy': {
    type: 'encounter',
    id: 'act1-spy',
    narration:
      'You go up and over, chimney to chimney, and find a vantage above the square. A rider in a longer cloak sits her horse ' +
      'apart from the rest, watching Old Sella\'s cottage with the patience of someone who already knows how this ends.',
    monster: { name: "The Ashen Circle's Voice", description: 'A raider captain, unhurried, clearly in command.', ac: 14, hp: 20 },
    choices: [
      {
        label: 'Slip closer along the rooftops (Stealth)',
        actor: 'pc2',
        ability: 'DEX',
        skill: 'Stealth',
        dc: 13,
        successNext: 'act1-spy-won',
        failureNext: 'act1-spy-lost',
        successEffects: [{ type: 'setFlag', flag: 'overheardCaptain' }],
      },
      {
        label: 'Watch and listen from the shadows below (Perception)',
        actor: 'companion2',
        ability: 'WIS',
        skill: 'Perception',
        dc: 12,
        successNext: 'act1-spy-won',
        failureNext: 'act1-spy-lost',
        successEffects: [{ type: 'setFlag', flag: 'overheardCaptain' }],
      },
    ],
  },
  'act1-spy-won': {
    type: 'narration',
    id: 'act1-spy-won',
    narration:
      'Close enough to hear it clean: "The seal, not the town. Leave the rest." The captain never raises her voice. ' +
      'Whatever the Ashen Circle wants, it is Sella\'s relic, not Millhaven itself. As she turns to go, a second column of ' +
      'riders peels off north along the river road — smaller, quieter, clearly not part of the raid on the granary.',
    choices: [
      { label: 'Follow the second column at a distance', next: 'act1-spy-shadow' },
      { label: "Get back down — you've heard enough", next: 'act1-raiders-retreat' },
    ],
  },
  'act1-spy-lost': {
    type: 'narration',
    id: 'act1-spy-lost',
    narration:
      'A loose tile gives you away. You\'re gone before anyone can climb after you — but not before you spot a second, ' +
      'smaller column of riders peeling off north along the river road, well clear of the noise at the granary.',
    choices: [
      { label: 'Follow the second column at a distance', next: 'act1-spy-shadow' },
      { label: 'Get back down and regroup with the others', next: 'act1-raiders-retreat' },
    ],
  },
  'act1-spy-shadow': {
    type: 'encounter',
    id: 'act1-spy-shadow',
    narration:
      'You trail the second column along the riverbank, close enough to see they\'re moving something heavy between two ' +
      'riders — a shape under a canvas tarp, roughly the size of a person.',
    monster: { name: 'Ashen Rearguard', description: 'Two riders, watching their own trail.', ac: 13, hp: 12 },
    choices: [
      {
        label: 'Stay low and keep pace without being made (Stealth)',
        actor: 'pc2',
        ability: 'DEX',
        skill: 'Stealth',
        dc: 14,
        successNext: 'act1-spy-shadow-won',
        failureNext: 'act1-spy-shadow-lost',
        successEffects: [{ type: 'setFlag', flag: 'sawSecondSquad' }],
      },
      {
        label: 'Track them by sound alone through the brush (Perception)',
        actor: 'companion2',
        ability: 'WIS',
        skill: 'Perception',
        dc: 13,
        successNext: 'act1-spy-shadow-won',
        failureNext: 'act1-spy-shadow-lost',
        successEffects: [{ type: 'setFlag', flag: 'sawSecondSquad' }],
      },
    ],
  },
  'act1-spy-shadow-won': {
    type: 'narration',
    id: 'act1-spy-shadow-won',
    narration:
      'The canvas slips loose for a moment at a river crossing — Old Sella herself, bound and silent, and beside her a ' +
      'small iron-banded chest that can only be the Cinderseal. They\'re headed north, into the Thornwood, before the tarp ' +
      'is cinched tight again.',
    choices: [{ label: 'Fall back before they notice you', next: 'act1-raiders-retreat' }],
  },
  'act1-spy-shadow-lost': {
    type: 'narration',
    id: 'act1-spy-shadow-lost',
    narration:
      'A rider wheels her horse around too fast for coincidence — you break for cover and don\'t stop until the sound of ' +
      'hooves fades north. Whatever they were carrying, you didn\'t get a clean look.',
    choices: [{ label: 'Head back and regroup', next: 'act1-raiders-retreat' }],
  },

  // ========================================================================
  // Opening branch 3: the militia — rally, then an evacuation complication
  // ========================================================================
  'act1-rally': {
    type: 'encounter',
    id: 'act1-rally',
    narration:
      'The town militia is half-dressed and scattering orders at each other in the square, more panic than plan. ' +
      'Someone needs to make them move as one before the raiders reach the heart of town.',
    monster: { name: 'Panicked Militia', description: 'Not a threat — a crowd that needs a spine.', ac: 10, hp: 0 },
    choices: [
      {
        label: 'Command them to hold the line (Intimidation)',
        actor: 'pc1',
        ability: 'CHA',
        skill: 'Intimidation',
        dc: 13,
        successNext: 'act1-rally-won',
        failureNext: 'act1-rally-lost',
        successEffects: [{ type: 'setFlag', flag: 'militiaRallied' }],
      },
      {
        label: 'Steady them with calm resolve (Persuasion)',
        actor: 'companion1',
        ability: 'CHA',
        skill: 'Persuasion',
        dc: 12,
        successNext: 'act1-rally-won',
        failureNext: 'act1-rally-lost',
        successEffects: [{ type: 'setFlag', flag: 'militiaRallied' }],
      },
    ],
  },
  'act1-rally-won': {
    type: 'narration',
    id: 'act1-rally-won',
    narration:
      'The militia falls into something like a line — not soldiers, but no longer a mob either. The captain grabs your ' +
      'sleeve: three families are still holed up near the riverside cottages, too close to the fighting, and someone needs ' +
      'to get them out.',
    choices: [{ label: 'Go get them out yourself', next: 'act1-rally-evacuate' }],
  },
  'act1-rally-lost': {
    type: 'narration',
    id: 'act1-rally-lost',
    narration:
      'They scatter anyway — not cowardice, just too much noise and fire for people who sell grain for a living. ' +
      'Worse, no one thought to warn the riverside cottages, where three families are now stranded far too close to the fighting.',
    choices: [{ label: 'Get them out yourself', next: 'act1-rally-evacuate' }],
  },
  'act1-rally-evacuate': {
    type: 'encounter',
    id: 'act1-rally-evacuate',
    narration:
      'Smoke has cut visibility to almost nothing between the cottages, and one of the elders can barely walk. ' +
      'You need to get all of them clear before the fire — or the raiders — reach the riverbank.',
    monster: { name: 'Smoke and Fire', description: 'The real danger here isn\'t a blade.', ac: 11, hp: 0 },
    choices: [
      {
        label: 'Find a safe path through the smoke (Perception)',
        actor: 'companion1',
        ability: 'WIS',
        skill: 'Perception',
        dc: 12,
        successNext: 'act1-rally-evacuate-won',
        failureNext: 'act1-rally-evacuate-lost',
        successEffects: [{ type: 'grantItem', item: { id: 'militia-token', name: 'Militia Token', description: "A brass token the militia captain pressed on you — 'you're one of us tonight,' she said." } }],
      },
      {
        label: 'Carry the elder yourself and push through (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 13,
        successNext: 'act1-rally-evacuate-won',
        failureNext: 'act1-rally-evacuate-lost',
        successEffects: [{ type: 'grantGold', amount: 10 }],
      },
    ],
  },
  'act1-rally-evacuate-won': {
    type: 'narration',
    id: 'act1-rally-evacuate-won',
    narration:
      'All three families make it to the square, shaken but unhurt. The elder grips your hand once, hard, and doesn\'t ' +
      'let go until she\'s steady on her feet again.',
    choices: [{ label: 'Regroup with the others', next: 'act1-raiders-retreat' }],
  },
  'act1-rally-evacuate-lost': {
    type: 'narration',
    id: 'act1-rally-evacuate-lost',
    narration:
      'You get them out, but the smoke takes its toll — coughing, stumbling, one child badly frightened. It could have ' +
      'gone worse. It could also have gone a great deal better.',
    choices: [
      { label: 'Regroup with the others', next: 'act1-raiders-retreat', effects: [{ type: 'hitPointChange', target: 'pc1', delta: -2, reason: 'smoke and strain' }] },
    ],
  },

  // ========================================================================
  // Reconvergence into the investigation hub
  // ========================================================================
  'act1-raiders-retreat': {
    type: 'narration',
    id: 'act1-raiders-retreat',
    narration:
      'By the time the last torch fades into the Thornwood, the Ashen Circle is gone — and so is Old Sella, and so is the ' +
      'Cinderseal. Millhaven is scorched, frightened, and yours to help set right before you can think about leaving it behind.',
    choices: [{ label: 'See what needs doing before you go', next: 'act1-hub' }],
  },

  'act1-hub': {
    type: 'narration',
    id: 'act1-hub',
    narration:
      'Dawn is still hours off. Millhaven is a town of small, urgent needs right now — and every hour you spend on them ' +
      'is an hour the trail north grows colder.',
    choices: [
      {
        label: 'Question the wounded raider before he recovers his nerve',
        next: 'act1-interrogate',
        condition: { flag: 'interrogateDone', equals: false },
      },
      {
        label: 'Help tend the wounded',
        next: 'act1-tend-wounded',
        condition: { flag: 'tendWoundedDone', equals: false },
      },
      {
        label: "Search Old Sella's ransacked cottage for clues",
        next: 'act1-search-cottage',
        condition: { flag: 'searchCottageDone', equals: false },
      },
      {
        label: 'Check on Dag Carrow, the miller',
        next: 'act1-miller-chat',
        condition: { flag: 'millerChatDone', equals: false },
      },
      { label: 'Enough — set out after the trail now', next: 'act1-milestone' },
    ],
  },

  // --- Hub spoke: interrogate the wounded raider ---
  'act1-interrogate': {
    type: 'encounter',
    id: 'act1-interrogate',
    narration:
      'One raider didn\'t make it out: young, bleeding from a fall off a low roof, very much alive and cornered in the ' +
      'alley behind the smithy. He\'s young enough that this is probably his first raid, and scared enough that it might ' +
      'also be his last. He won\'t look at you.',
    monster: { name: 'Wounded Ashen Raider', description: 'Young, injured, frightened rather than fanatical.', ac: 11, hp: 4 },
    choices: [
      {
        label: 'Press him hard for answers (Intimidation)',
        actor: 'pc2',
        ability: 'CHA',
        skill: 'Intimidation',
        dc: 14,
        successNext: 'act1-interrogate-won',
        failureNext: 'act1-interrogate-lost',
        successEffects: [
          { type: 'setFlag', flag: 'knowsRaiderCamp' },
          { type: 'setFlag', flag: 'interrogateDone' },
          { type: 'grantItem', item: { id: 'map-fragment', name: 'Torn Map Fragment', description: 'A rough sketch of a camp somewhere in the Thornwood, marked with an ash-grey sigil.' } },
        ],
        failureEffects: [
          { type: 'setFlag', flag: 'interrogateDone' },
          {
            type: 'grantCurse',
            target: 'pc2',
            curse: { id: 'ashmark', name: 'Ashmark', description: "A faint grey sigil the raider burned into your palm as he broke free — the Ashen Circle's scouts seem to notice you now." },
          },
        ],
      },
      {
        label: 'Read his fear and press gently instead (Insight)',
        actor: 'companion2',
        ability: 'WIS',
        skill: 'Insight',
        dc: 13,
        successNext: 'act1-interrogate-won',
        failureNext: 'act1-interrogate-lost',
        successEffects: [
          { type: 'setFlag', flag: 'knowsRaiderCamp' },
          { type: 'setFlag', flag: 'interrogateDone' },
          { type: 'grantGold', amount: 10 },
        ],
        failureEffects: [
          { type: 'setFlag', flag: 'interrogateDone' },
          {
            type: 'grantCurse',
            target: 'companion2',
            curse: { id: 'ashmark', name: 'Ashmark', description: "A faint grey sigil the raider burned into your palm as he broke free — the Ashen Circle's scouts seem to notice you now." },
          },
        ],
      },
    ],
  },
  'act1-interrogate-won': {
    type: 'narration',
    id: 'act1-interrogate-won',
    narration:
      'It comes out in pieces — a camp in the Thornwood, a captain called Vesh, and a phrase he clearly wasn\'t supposed to ' +
      'repeat: "waking Umbrask." He doesn\'t know what it means. Neither do you, yet.',
    choices: [{ label: 'Let him go and see to the rest of Millhaven', next: 'act1-hub' }],
  },
  'act1-interrogate-lost': {
    type: 'narration',
    id: 'act1-interrogate-lost',
    narration:
      'He twists free before you get anything useful, pressing something searing into whoever held him as he goes — ' +
      'gone into the dark before anyone can stop him.',
    choices: [{ label: 'Let him go and see to the rest of Millhaven', next: 'act1-hub' }],
  },

  // --- Hub spoke: tend the wounded ---
  'act1-tend-wounded': {
    type: 'encounter',
    id: 'act1-tend-wounded',
    narration:
      'The square has become a makeshift infirmary — burns, a broken wrist, a woman who won\'t stop shaking though nothing ' +
      'is visibly wrong with her. They need hands more than they need heroics right now.',
    monster: { name: "Millhaven's Wounded", description: 'Not a fight — a town that needs steady hands.', ac: 10, hp: 0 },
    choices: [
      {
        label: 'Bind wounds with practiced care (Medicine)',
        actor: 'pc1',
        ability: 'WIS',
        skill: 'Medicine',
        dc: 12,
        successNext: 'act1-tend-wounded-won',
        failureNext: 'act1-tend-wounded-lost',
        successEffects: [
          { type: 'setFlag', flag: 'tendWoundedDone' },
          { type: 'setFlag', flag: 'townsGrateful' },
          { type: 'hitPointChange', target: 'party', delta: 2, reason: "a healer presses Sella's spare poultices on you, insisting you take some too" },
          { type: 'grantItem', item: { id: 'sella-poultice', name: "Sella's Poultice", description: 'A small jar of herbal salve, the last of its kind until Sella comes home.' } },
        ],
        failureEffects: [{ type: 'setFlag', flag: 'tendWoundedDone' }],
      },
      {
        label: 'Keep their spirits up while others work (Performance)',
        actor: 'companion1',
        ability: 'CHA',
        skill: 'Performance',
        dc: 11,
        successNext: 'act1-tend-wounded-won',
        failureNext: 'act1-tend-wounded-lost',
        successEffects: [
          { type: 'setFlag', flag: 'tendWoundedDone' },
          { type: 'setFlag', flag: 'townsGrateful' },
          { type: 'grantGold', amount: 8 },
        ],
        failureEffects: [{ type: 'setFlag', flag: 'tendWoundedDone' }],
      },
    ],
  },
  'act1-tend-wounded-won': {
    type: 'narration',
    id: 'act1-tend-wounded-won',
    narration:
      'By the time you\'re done, the worst of it is bandaged, and the shaking woman is asleep against her husband\'s ' +
      'shoulder. It isn\'t glory. It\'s the kind of help Millhaven will actually remember.',
    choices: [{ label: 'See to the rest', next: 'act1-hub' }],
  },
  'act1-tend-wounded-lost': {
    type: 'narration',
    id: 'act1-tend-wounded-lost',
    narration:
      'You do what you can, but you\'re not a healer, and it shows. Someone more practiced gently takes over. ' +
      'No harm done, but no particular help either.',
    choices: [{ label: 'See to the rest', next: 'act1-hub' }],
  },

  // --- Hub spoke: search Sella's cottage ---
  'act1-search-cottage': {
    type: 'encounter',
    id: 'act1-search-cottage',
    narration:
      "Sella's cottage has been turned over floor to rafter — whatever the Ashen Circle wanted, they searched hard for it. " +
      'A ward-glyph is still scorched into the doorframe, half-broken, still faintly warm.',
    monster: { name: "Sella's Wardings", description: 'Old protective magic, disturbed and unstable.', ac: 12, hp: 0 },
    choices: [
      {
        label: 'Search methodically, room by room (Investigation)',
        actor: 'pc2',
        ability: 'INT',
        skill: 'Investigation',
        dc: 13,
        successNext: 'act1-search-cottage-won',
        failureNext: 'act1-search-cottage-lost',
        successEffects: [
          { type: 'setFlag', flag: 'searchCottageDone' },
          { type: 'setFlag', flag: 'learnedCinderlore' },
          { type: 'grantItem', item: { id: 'sella-journal-page', name: "Torn Page from Sella's Journal", description: '"...the Cinderseal does not hold Umbrask down. It holds the door shut. There is a difference, and they mean to learn it."' } },
        ],
        failureEffects: [{ type: 'setFlag', flag: 'searchCottageDone' }],
      },
      {
        label: 'Trust your instincts about what\'s out of place (Perception)',
        actor: 'companion2',
        ability: 'WIS',
        skill: 'Perception',
        dc: 12,
        successNext: 'act1-search-cottage-won',
        failureNext: 'act1-search-cottage-lost',
        successEffects: [
          { type: 'setFlag', flag: 'searchCottageDone' },
          { type: 'setFlag', flag: 'learnedCinderlore' },
          { type: 'grantGold', amount: 12 },
        ],
        failureEffects: [
          { type: 'setFlag', flag: 'searchCottageDone' },
          {
            type: 'grantCurse',
            target: 'companion2',
            curse: { id: 'wardburn', name: 'Wardburn', description: "The broken glyph flared white-hot against your hand before it died. Warded doors and old magic seem to know your touch now — rarely kindly." },
          },
        ],
      },
    ],
  },
  'act1-search-cottage-won': {
    type: 'narration',
    id: 'act1-search-cottage-won',
    narration:
      'Under a floorboard the raiders missed, you find a page torn loose from Sella\'s own journal — half a sentence that ' +
      'makes the back of your neck prickle, about the Cinderseal being a door rather than a cage.',
    choices: [{ label: 'Pocket it and move on', next: 'act1-hub' }],
  },
  'act1-search-cottage-lost': {
    type: 'narration',
    id: 'act1-search-cottage-lost',
    narration:
      'Whatever was here worth finding, the Ashen Circle already took it, or you\'ve missed it in the wreckage. ' +
      'The cottage gives up nothing more tonight.',
    choices: [{ label: 'Leave it and move on', next: 'act1-hub' }],
  },

  // --- Hub spoke: check on the miller (flavor only, no check) ---
  'act1-miller-chat': {
    type: 'narration',
    id: 'act1-miller-chat',
    narration:
      'Dag Carrow is sitting outside the mill with Pell asleep against his side, watching the last embers of the granary ' +
      'die down. He presses a handful of coin into your hand before you can refuse it. "For the road," he says. "Wherever ' +
      'it takes you."',
    choices: [
      {
        label: 'Thank him and get back to it',
        next: 'act1-hub',
        effects: [{ type: 'grantGold', amount: 8 }, { type: 'setFlag', flag: 'millerChatDone' }],
      },
    ],
  },

  // ========================================================================
  // Milestone and departure
  // ========================================================================
  'act1-milestone': {
    type: 'narration',
    id: 'act1-milestone',
    narration:
      'Millhaven will mend, one way or another — that much is no longer yours to carry. The Cinderseal, and Old Sella, will not wait.',
    choices: [
      {
        label: 'Gather what you have and prepare to leave',
        next: 'act1-departure',
        effects: [{ type: 'levelUp', target: 'party' }],
      },
    ],
  },
  'act1-departure': {
    type: 'narration',
    id: 'act1-departure',
    narration:
      'By torchlight you follow the raiders\' trail to the edge of the Thornwood, where the tracks turn north into country ' +
      'none of you know. Somewhere ahead of you, Vesh and the Ashen Circle are carrying an old woman and an older relic ' +
      'toward something called Umbrask. Whatever that is, you\'re about to find out.',
    // Hands off directly into Act 2's opening scene (shared/src/campaign/act2.ts).
    // The two acts are merged into one Campaign graph in activeCampaign.ts, so
    // this cross-act reference resolves once both files are combined; graph
    // validation for the full merged campaign lives in campaign.test.ts.
    choices: [{ label: 'Cross into the Thornwood', next: 'act2-start' }],
  },
}
