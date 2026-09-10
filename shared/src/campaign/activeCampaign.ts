import { ACT1_SCENES } from './act1.js'
import type { Campaign } from './types.js'

// The live campaign content. Update this as later acts are written —
// nothing else in the app references act files directly.
export const ACTIVE_CAMPAIGN: Campaign = { ...ACT1_SCENES }
export const CAMPAIGN_START_SCENE_ID = 'act1-start'
