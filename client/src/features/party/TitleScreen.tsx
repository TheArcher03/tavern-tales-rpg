import { ACTIVE_CAMPAIGN } from '@tavern-tales/shared'
import './TitleScreen.css'

// Pulls act titles straight from the same chapterBreak metadata StoryShell
// uses for its mid-game splashes, so this list can never drift out of sync
// with the content as acts are added or renamed.
function actTitle(sceneId: string): string | null {
  const scene = ACTIVE_CAMPAIGN[sceneId]
  return scene?.type === 'narration' && scene.chapterBreak ? scene.chapterBreak.enteringTitle : null
}

const ACT_TITLES = ['act1-start', 'act2-start', 'act3-start'].map(actTitle).filter((title): title is string => title !== null)

interface TitleScreenProps {
  onBegin: () => void
}

export function TitleScreen({ onBegin }: TitleScreenProps) {
  return (
    <div className="title-screen">
      <h1 className="title-screen__title">Tavern Tales</h1>
      <p className="title-screen__tagline">A tale told in choices, not dice rolled alone.</p>
      <ol className="title-screen__acts">
        {ACT_TITLES.map((title) => (
          <li key={title}>{title}</li>
        ))}
      </ol>
      <button type="button" className="title-screen__begin" onClick={onBegin}>
        Begin Your Adventure
      </button>
    </div>
  )
}
