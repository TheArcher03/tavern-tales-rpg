// Circular type-only import: campaign/types.ts imports Item (for grantItem
// effects and ShopOffer), and Item optionally carries SceneEffect[] here
// (for usable items). Both files are pure type/interface declarations with
// no runtime code, so this circular `import type` is erased at compile
// time and has no runtime circularity — safe by construction.
import type { SceneEffect } from './campaign/types.js'

// An item that can be consumed later (from the party panel, any time, not
// just in the scene it was granted) for its own effect — a healing
// draught, a curse-cleansing charm, etc. Reuses the existing SceneEffect
// vocabulary rather than inventing a new "temporary buff" mechanic.
export interface ItemUsable {
  effects: SceneEffect[]
  /** Shown when the item is used, e.g. "You drink the draught and feel your wounds close." */
  useNarration: string
}

export interface Item {
  id: string
  name: string
  description: string
  usable?: ItemUsable
}
