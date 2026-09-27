import { SCENE_IMAGES } from './sceneImages'

// Renders the illustration for a given scene, if one exists. Used inline
// by StoryLog for 'image' entries, so it lives in scrollback like any
// other message rather than disappearing once the player moves on.
export function SceneImage({ sceneId, onLoad }: { sceneId: string; onLoad?: () => void }) {
  const src = SCENE_IMAGES[sceneId]
  if (!src) return null

  return (
    <div className="scene-image">
      <img src={src} alt="" onLoad={onLoad} />
    </div>
  )
}
