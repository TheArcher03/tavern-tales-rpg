import { useState, type FormEvent } from 'react'

interface FreeTextInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
}

export function FreeTextInput({ onSubmit, disabled = false }: FreeTextInputProps) {
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
        disabled={disabled}
      />
      <button type="submit" disabled={disabled}>
        Send
      </button>
    </form>
  )
}
