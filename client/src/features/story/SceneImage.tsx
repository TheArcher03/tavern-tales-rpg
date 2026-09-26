import { SCENE_IMAGES } from './sceneImages'

// Renders the illustration for the current scene, if one exists — tied
// to whichever scene is presently active, not stored in the log, so it
// naturally disappears once the player moves past that moment (matching
// how ChoiceButtons/ShopScreen already work: current-scene UI, not
// scrollback history).
export function SceneImage({ sceneId }: { sceneId: string }) {
  const src = SCENE_IMAGES[sceneId]
  if (!src) return null

  return (
    <div className="scene-image">
      <img src={src} alt="" />
    </div>
  )
}
