import { useEffect, useRef } from 'react'
import { speak } from './narration'

interface StoryInterstitialProps {
  kind: 'chapter' | 'death'
  title: string
  subtitle?: string
  body?: string
  continueLabel?: string
  onContinue: () => void
  /** Read the title/subtitle/body aloud once, on mount, if narration is enabled. */
  narrate?: boolean
}

// A full-screen moment that pauses the normal log/choices flow — used for
// both act transitions (kind="chapter") and character deaths (kind="death")
// rather than two bespoke components, since both share the same shape:
// something dramatic to show and dismiss before the story continues.
export function StoryInterstitial({
  kind,
  title,
  subtitle,
  body,
  continueLabel = 'Continue',
  onContinue,
  narrate = false,
}: StoryInterstitialProps) {
  const hasSpokenRef = useRef(false)

  useEffect(() => {
    // Guards against StrictMode's dev-only double-invoke of mount effects,
    // same as StoryShell's own opening-narration mount effect.
    if (hasSpokenRef.current || !narrate) return
    hasSpokenRef.current = true
    speak([subtitle, title, body].filter(Boolean).join('. '), 'dm')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`story-interstitial story-interstitial--${kind}`}>
      {subtitle && <p className="story-interstitial__subtitle">{subtitle}</p>}
      <h2 className="story-interstitial__title">{title}</h2>
      {body && <p className="story-interstitial__body">{body}</p>}
      <button type="button" className="story-interstitial__continue" onClick={onContinue}>
        {continueLabel}
      </button>
    </div>
  )
}
