import type { StoryEntry } from '@tavern-tales/shared'

export function StoryLog({ entries }: { entries: StoryEntry[] }) {
  return (
    <div className="story-log">
      {entries.map((entry) => (
        <p key={entry.id} className={`story-log__entry story-log__entry--${entry.speaker}`}>
          {entry.text}
        </p>
      ))}
    </div>
  )
}
