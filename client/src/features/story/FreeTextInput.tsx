import { useState, type FormEvent } from 'react'

export function FreeTextInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setText('')
  }

  return (
    <form className="free-text-input" onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What do you do?"
        aria-label="Free-text action"
      />
      <button type="submit">Send</button>
    </form>
  )
}
