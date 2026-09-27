import { useEffect, useRef } from 'react'
import type { StoryEntry } from '@tavern-tales/shared'
import { SceneImage } from './SceneImage'

export function StoryLog({ entries }: { entries: StoryEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ block: 'end' })

  useEffect(() => {
    scrollToBottom()
  }, [entries.length])

  return (
    <div className="story-log">
      {entries.map((entry) =>
        entry.speaker === 'image' ? (
          // Images load asynchronously, well after this effect has already
          // scrolled based on the pre-image layout — without re-scrolling
          // on load, the image pops in below the fold and the log looks
          // stuck instead of following it down.
          <SceneImage key={entry.id} sceneId={entry.text} onLoad={scrollToBottom} />
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
