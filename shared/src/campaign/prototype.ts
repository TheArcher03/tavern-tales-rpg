import type { Campaign } from './types.js'

// No longer the active campaign (Act 1 is, as of shared/src/campaign/act1.ts) —
// kept only as a small, stable fixture for exercising the engine (a branch,
// an encounter with two approaches, a level-up trigger, gold, HP loss, and
// three distinct endings) without depending on real story content.
export const PROTOTYPE_CAMPAIGN: Campaign = {
  start: {
    type: 'narration',
    id: 'start',
    narration:
      'The road forks at the edge of a dark wood. To the left, a footpath vanishes into the trees. ' +
      'To the right, the lights of a small town flicker through the rain.',
    choices: [
      { label: 'Take the footpath into the woods', next: 'woods-encounter' },
      { label: 'Head into the town instead', next: 'town' },
    ],
  },
  'woods-encounter': {
    type: 'encounter',
    id: 'woods-encounter',
    narration: 'A gaunt wolf blocks the path, hackles raised, blocking the way forward.',
    monster: { name: 'Wolf', description: 'A lean, hungry wolf.', ac: 13, hp: 11 },
    choices: [
      {
        label: 'Drive it off (STR)',
        actor: 'pc1',
        ability: 'STR',
        dc: 12,
        successNext: 'woods-won',
        failureNext: 'woods-lost',
        successEffects: [{ type: 'grantGold', amount: 10 }],
        failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -4, reason: 'bitten by the wolf' }],
      },
      {
        label: 'Slip past it quietly (Stealth)',
        actor: 'pc2',
        ability: 'DEX',
        skill: 'Stealth',
        dc: 13,
        successNext: 'woods-snuck',
        failureNext: 'woods-lost',
        failureEffects: [{ type: 'hitPointChange', target: 'pc2', delta: -2, reason: 'clipped by a snapping jaw' }],
      },
    ],
  },
  'woods-won': {
    type: 'narration',
    id: 'woods-won',
    narration: 'The wolf yelps and bolts into the underbrush. Beyond, the path opens into moonlit fields.',
    choices: [
      {
        label: 'Press onward',
        next: 'ending-good',
        effects: [{ type: 'levelUp', target: 'party' }],
      },
    ],
  },
  'woods-snuck': {
    type: 'narration',
    id: 'woods-snuck',
    narration: 'You slip past the wolf without a sound, hearts pounding, and reach the open fields beyond.',
    choices: [{ label: 'Press onward', next: 'ending-good', effects: [{ type: 'levelUp', target: 'party' }] }],
  },
  'woods-lost': {
    type: 'narration',
    id: 'woods-lost',
    narration: 'The wolf gets the better of the exchange before finally breaking off, leaving you battered.',
    choices: [{ label: 'Retreat to the town', next: 'ending-bad' }],
  },
  town: {
    type: 'narration',
    id: 'town',
    narration: 'The town is quiet and dry. Nothing here needs your sword tonight.',
    choices: [{ label: 'Find an inn and rest', next: 'ending-neutral' }],
  },
  'ending-good': {
    type: 'ending',
    id: 'ending-good',
    title: 'The Open Road',
    narration: 'You cross the fields under a clearing sky, stronger for the trial behind you.',
  },
  'ending-bad': {
    type: 'ending',
    id: 'ending-bad',
    title: 'A Bloodied Retreat',
    narration: 'You limp back toward the lights of the town, the woods unconquered.',
  },
  'ending-neutral': {
    type: 'ending',
    id: 'ending-neutral',
    title: 'A Quiet Night',
    narration: 'Nothing eventful finds you tonight. Tomorrow is another day.',
  },
}
