import type { Campaign } from './types.js'

// A fixed safety-net ending, not owned by any single act: if every party
// member dies, StoryShell overrides whatever the authored nextSceneId was
// and routes here instead, regardless of which act it happened in.
export const GLOBAL_ENDING_SCENES: Campaign = {
  'party-wiped': {
    type: 'ending',
    id: 'party-wiped',
    title: 'The Party Falls',
    narration:
      'The Thornwood does not care who you were or what you meant to do — only that, tonight, it was stronger than all ' +
      'four of you together. Whatever you set out to stop continues without you, unopposed. Somewhere, someone will ' +
      'eventually piece together what happened here. It will not be soon enough to matter.',
  },
}
