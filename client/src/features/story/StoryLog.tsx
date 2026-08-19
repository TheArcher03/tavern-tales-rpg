export interface StoryEntry {
  id: string
  speaker: 'dm' | 'player' | 'system'
  text: string
}

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
