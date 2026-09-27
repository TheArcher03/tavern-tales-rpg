import { useEffect, useRef } from 'react'
import type { StoryEntry } from '@tavern-tales/shared'
import { SceneImage } from './SceneImage'

export function StoryLog({ entries }: { entries: StoryEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [entries.length])

  return (
    <div className="story-log">
      {entries.map((entry) =>
        entry.speaker === 'image' ? (
          <SceneImage key={entry.id} sceneId={entry.text} />
        ) : (
          <p key={entry.id} className={`story-log__entry story-log__entry--${entry.speaker}`}>
            {entry.text}
          </p>
        ),
      )}
      <div ref={bottomRef} />
    </div>
  )
}
