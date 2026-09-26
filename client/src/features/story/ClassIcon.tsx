import type { ReactElement } from 'react'

// Simple emblems, one per core class — a lightweight stand-in for real
// illustrated portraits (no image-generation tool is available in this
// environment, so this is SVG/CSS only, no external assets). Weapon
// glyphs (fighter/rogue) are filled solid silhouettes rather than
// stroked outlines — outlines of thin shapes like a blade blur into
// ambiguous shapes at badge size, filled shapes read clearly.
const CLASS_GLYPHS: Record<string, ReactElement> = {
  fighter: (
    <g fill="currentColor" stroke="none">
      <path d="M12 2 14.4 14 9.6 14Z" />
      <rect x="7" y="14" width="10" height="1.6" rx="0.6" />
      <rect x="11" y="15.8" width="2" height="4.6" rx="0.6" />
      <circle cx="12" cy="21.2" r="1.3" />
    </g>
  ),
  wizard: (
    <path
      d="M12 3 5 19h14L12 3Zm0 5 1 2h-2l1-2Zm-3.5 8h7M17.5 5.5l1 1M18.5 4l.6.6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  rogue: (
    <g fill="currentColor" stroke="none">
      <path d="M12 4 15 11.5 12 15 9 11.5Z" />
      <rect x="7" y="15" width="10" height="1.4" rx="0.6" />
      <rect x="11" y="16.6" width="2" height="4" rx="0.6" />
      <circle cx="12" cy="21" r="1.1" />
    </g>
  ),
  cleric: (
    <path
      d="M12 3v18M5 9h14M8 5.5 12 9l4-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
}

interface ClassIconProps {
  classId: string
  className?: string
}

export function ClassIcon({ classId, className }: ClassIconProps) {
  const glyph = CLASS_GLYPHS[classId]
  if (!glyph) return null

  return (
    <span className={`class-icon${className ? ` ${className}` : ''}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {glyph}
      </svg>
    </span>
  )
}
