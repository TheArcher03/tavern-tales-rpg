interface StoryInterstitialProps {
  kind: 'chapter' | 'death'
  title: string
  subtitle?: string
  body?: string
  continueLabel?: string
  onContinue: () => void
}

// A full-screen moment that pauses the normal log/choices flow — used for
// both act transitions (kind="chapter") and character deaths (kind="death")
// rather than two bespoke components, since both share the same shape:
// something dramatic to show and dismiss before the story continues.
export function StoryInterstitial({ kind, title, subtitle, body, continueLabel = 'Continue', onContinue }: StoryInterstitialProps) {
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
