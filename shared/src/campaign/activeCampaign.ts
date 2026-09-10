import { ACT1_SCENES } from './act1.js'
import { ACT2_SCENES } from './act2.js'
import { ACT3_SCENES } from './act3.js'
import { GLOBAL_ENDING_SCENES } from './globalEndings.js'
import type { Campaign } from './types.js'

// The live campaign content. Update this as later acts are written —
// nothing else in the app references act files directly.
export const ACTIVE_CAMPAIGN: Campaign = { ...ACT1_SCENES, ...ACT2_SCENES, ...ACT3_SCENES, ...GLOBAL_ENDING_SCENES }
export const CAMPAIGN_START_SCENE_ID = 'act1-start'
