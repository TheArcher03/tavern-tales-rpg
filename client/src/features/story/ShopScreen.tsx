import type { PartyState, ShopOffer, ShopScene } from '@tavern-tales/shared'

interface ShopScreenProps {
  scene: ShopScene
  party: PartyState
  onPurchase: (offer: ShopOffer) => void
}

// Rendered alongside the scene's normal narration + leave-choices
// (StoryShell handles those). Buying stays in the shop — it doesn't
// advance the scene — so the player can purchase more than one thing
// before leaving via the scene's own choices.
export function ShopScreen({ scene, party, onPurchase }: ShopScreenProps) {
  return (
    <div className="shop-screen">
      <h2 className="shop-screen__shopkeeper">{scene.shopkeeper}</h2>
      <ul className="shop-screen__offers">
        {scene.offers.map((offer) => {
          const affordable = party.sharedGold >= offer.cost
          return (
            <li key={offer.id} className="shop-screen__offer">
              <div className="shop-screen__offer-text">
                <p className="shop-screen__offer-name">{offer.name}</p>
                <p className="shop-screen__offer-description">{offer.description}</p>
              </div>
              <button type="button" onClick={() => onPurchase(offer)} disabled={!affordable}>
                💰 {offer.cost}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
