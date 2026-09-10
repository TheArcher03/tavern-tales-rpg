import { useEffect, useRef, useState } from 'react'
import {
  ACTIVE_CAMPAIGN,
  SLOT_INDEX,
  applyAbilityIncrease,
  isChoiceAvailable,
  resolveActingMember,
  resolveChoice,
  resolveEncounterChoice,
  resolvePurchase,
  useItem,
  type AbilityName,
  type ChapterBreak,
  type Choice,
  type ChoiceOutcome,
  type EncounterChoice,
  type EncounterOutcome,
  type PartySlot,
  type PartyState,
  type ShopOffer,
  type StoryEntry,
} from '@tavern-tales/shared'
import { PartyPanel } from './PartyPanel'
import { StoryLog } from './StoryLog'
import { ChoiceButtons } from './ChoiceButtons'
import { StoryInterstitial } from './StoryInterstitial'
import { LevelUpChoice } from './LevelUpChoice'
import { ShopScreen } from './ShopScreen'
import { DiceRollReveal } from './DiceRollReveal'
import { SkillsGuide } from './SkillsGuide'
import './StoryShell.css'

interface StoryShellProps {
  party: PartyState
  onPartyChange: (updater: PartyState | ((current: PartyState) => PartyState)) => void
  entries: StoryEntry[]
  onEntriesChange: (updater: StoryEntry[] | ((current: StoryEntry[]) => StoryEntry[])) => void
  onStartNewGame: () => void
}

// One step that must be shown and dismissed before a scene transition is
// finalized. A dice roll comes from resolving an encounter choice; deaths
// and level-up choices come from the outcome of the choice just made; a
// chapter break comes from the destination scene. None of this is
// persisted mid-flight — refreshing during an interstitial loses that one
// in-flight transition, same as any other unsaved UI action.
type PendingStep =
  | { kind: 'diceRoll'; actorName: string; checkLabel: string; dc: number; roll: number; modifier: number; total: number; success: boolean }
  | { kind: 'death'; name: string }
  | { kind: 'levelUp'; slot: PartySlot }
  | { kind: 'chapterBreak'; chapterBreak: ChapterBreak }

interface PendingTransition {
  steps: PendingStep[]
  party: PartyState
  logs: string[]
  choiceLabel: string
  checkLog?: string
  nextSceneId: string
}

export function StoryShell({ party, onPartyChange, entries, onEntriesChange, onStartNewGame }: StoryShellProps) {
  const hasStartedRef = useRef(false)
  const scene = ACTIVE_CAMPAIGN[party.currentSceneId]

  const [initialChapterBreak, setInitialChapterBreak] = useState<ChapterBreak | null>(null)
  const [pending, setPending] = useState<PendingTransition | null>(null)
  const [showSkillsGuide, setShowSkillsGuide] = useState(false)

  useEffect(() => {
    // Guards against StrictMode's dev-only double-invoke of mount effects,
    // and skips re-seeding the log when resuming a saved game.
    if (hasStartedRef.current || entries.length > 0) return
    hasStartedRef.current = true
    if (scene.type === 'narration' && scene.chapterBreak) {
      setInitialChapterBreak(scene.chapterBreak)
    } else {
      onEntriesChange([{ id: crypto.randomUUID(), speaker: 'dm', text: scene.narration }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismissInitialChapterBreak = () => {
    setInitialChapterBreak(null)
    onEntriesChange([{ id: crypto.randomUUID(), speaker: 'dm', text: scene.narration }])
  }

  // Commits a fully-resolved transition: appends log entries and advances
  // party.currentSceneId in one shot, exactly as a plain choice always has.
  const commitTransition = (choiceLabel: string, finalParty: PartyState, logs: string[], nextSceneId: string, checkLog?: string) => {
    const nextScene = ACTIVE_CAMPAIGN[nextSceneId]
    onEntriesChange((current) => {
      const next: StoryEntry[] = [...current, { id: crypto.randomUUID(), speaker: 'player', text: choiceLabel }]
      if (checkLog) next.push({ id: crypto.randomUUID(), speaker: 'system', text: checkLog })
      for (const log of logs) next.push({ id: crypto.randomUUID(), speaker: 'system', text: log })
      if (nextScene.type === 'ending') {
        next.push({ id: crypto.randomUUID(), speaker: 'system', text: `🏁 ${nextScene.title}` })
      }
      next.push({ id: crypto.randomUUID(), speaker: 'dm', text: nextScene.narration })
      return next
    })
    onPartyChange({ ...finalParty, currentSceneId: nextSceneId })
  }

  // Builds the pending-steps queue for one resolved choice/encounter
  // outcome, then either commits right away (nothing to show) or stages
  // the transition for the player to work through one step at a time. All
  // four party slots get an interactive level-up choice — none are
  // auto-assigned.
  const beginTransition = (
    choiceLabel: string,
    outcome: ChoiceOutcome | EncounterOutcome,
    checkLog?: string,
    diceRollStep?: PendingStep,
  ) => {
    const deathSteps: PendingStep[] = outcome.deaths.map((name) => ({ kind: 'death', name }))

    const levelUpSteps: PendingStep[] = (['pc1', 'pc2', 'companion1', 'companion2'] as const)
      .filter((slot) => outcome.party.members[SLOT_INDEX[slot]].level > party.members[SLOT_INDEX[slot]].level)
      .map((slot) => ({ kind: 'levelUp', slot }))

    const allDead = outcome.party.members.every((member) => member.status === 'dead')
    const finalNextSceneId = allDead ? 'party-wiped' : outcome.nextSceneId
    const nextScene = ACTIVE_CAMPAIGN[finalNextSceneId]
    const chapterSteps: PendingStep[] =
      !allDead && nextScene.type === 'narration' && nextScene.chapterBreak
        ? [{ kind: 'chapterBreak', chapterBreak: nextScene.chapterBreak }]
        : []

    const steps = [...(diceRollStep ? [diceRollStep] : []), ...deathSteps, ...levelUpSteps, ...chapterSteps]

    if (steps.length === 0) {
      commitTransition(choiceLabel, outcome.party, outcome.logs, finalNextSceneId, checkLog)
      return
    }

    setPending({ steps, party: outcome.party, logs: outcome.logs, choiceLabel, checkLog, nextSceneId: finalNextSceneId })
  }

  // Advances past a death or chapter-break step (no data to fold in).
  const advancePending = () => {
    if (!pending) return
    const [, ...rest] = pending.steps
    if (rest.length === 0) {
      commitTransition(pending.choiceLabel, pending.party, pending.logs, pending.nextSceneId, pending.checkLog)
      setPending(null)
    } else {
      setPending({ ...pending, steps: rest })
    }
  }

  // Advances past a level-up step, folding the chosen ability increase
  // into the in-flight party state before moving to the next step.
  const advancePendingLevelUp = (ability: AbilityName) => {
    if (!pending) return
    const [current, ...rest] = pending.steps
    if (!current || current.kind !== 'levelUp') return
    const updatedParty = applyAbilityIncrease(pending.party, current.slot, ability)
    if (rest.length === 0) {
      commitTransition(pending.choiceLabel, updatedParty, pending.logs, pending.nextSceneId, pending.checkLog)
      setPending(null)
    } else {
      setPending({ ...pending, steps: rest, party: updatedParty })
    }
  }

  const handleChoice = (choice: Choice) => beginTransition(choice.label, resolveChoice(party, choice))

  const handleEncounterChoice = (choice: EncounterChoice) => {
    const outcome = resolveEncounterChoice(party, choice)
    // The real check already happened above — this step only delays
    // revealing it, so the mechanic itself is unchanged, just dramatized.
    const diceRollStep: PendingStep = {
      kind: 'diceRoll',
      actorName: outcome.actorName,
      checkLabel: outcome.checkLabel,
      dc: outcome.check.dc,
      roll: outcome.check.roll,
      modifier: outcome.check.modifier,
      total: outcome.check.total,
      success: outcome.check.success,
    }
    beginTransition(choice.label, outcome, outcome.checkLog, diceRollStep)
  }

  const handlePurchase = (offer: ShopOffer) => {
    const { party: next, logs } = resolvePurchase(party, offer)
    onEntriesChange((current) => [
      ...current,
      ...logs.map((log) => ({ id: crypto.randomUUID(), speaker: 'system' as const, text: log })),
    ])
    onPartyChange(next)
  }

  const handleUseItem = (itemId: string) => {
    const result = useItem(party, itemId)
    if (!result) return
    onEntriesChange((current) => [
      ...current,
      ...result.logs.map((log) => ({ id: crypto.randomUUID(), speaker: 'system' as const, text: log })),
    ])
    onPartyChange(result.party)
  }

  const displayParty = pending ? pending.party : party

  if (initialChapterBreak) {
    return (
      <div className="story-shell">
        <PartyPanel party={displayParty} onUseItem={handleUseItem} />
        <main className="story-shell__main">
          <StoryInterstitial
            kind="chapter"
            title={initialChapterBreak.enteringTitle}
            subtitle={initialChapterBreak.completedTitle}
            body={initialChapterBreak.enteringSubtitle}
            onContinue={dismissInitialChapterBreak}
          />
        </main>
      </div>
    )
  }

  const pendingStep = pending?.steps[0]
  if (pendingStep) {
    return (
      <div className="story-shell">
        <PartyPanel party={displayParty} onUseItem={handleUseItem} />
        <main className="story-shell__main">
          {pendingStep.kind === 'diceRoll' && (
            <DiceRollReveal
              actorName={pendingStep.actorName}
              checkLabel={pendingStep.checkLabel}
              dc={pendingStep.dc}
              roll={pendingStep.roll}
              modifier={pendingStep.modifier}
              total={pendingStep.total}
              success={pendingStep.success}
              onContinue={advancePending}
            />
          )}
          {pendingStep.kind === 'death' && (
            <StoryInterstitial
              kind="death"
              title={`${pendingStep.name} has fallen.`}
              body="Whatever waits ahead, it waits for one fewer than it expected."
              onContinue={advancePending}
            />
          )}
          {pendingStep.kind === 'levelUp' && (
            <LevelUpChoice character={pending!.party.members[SLOT_INDEX[pendingStep.slot]]} onPick={advancePendingLevelUp} />
          )}
          {pendingStep.kind === 'chapterBreak' && (
            <StoryInterstitial
              kind="chapter"
              title={pendingStep.chapterBreak.enteringTitle}
              subtitle={pendingStep.chapterBreak.completedTitle}
              body={pendingStep.chapterBreak.enteringSubtitle}
              onContinue={advancePending}
            />
          )}
        </main>
      </div>
    )
  }

  const availableChoices = scene.type === 'ending' ? [] : scene.choices.filter((choice) => isChoiceAvailable(party, choice.condition))

  return (
    <div className="story-shell">
      <PartyPanel party={displayParty} onUseItem={handleUseItem} />
      <main className="story-shell__main">
        <StoryLog entries={entries} />
        {scene.type === 'ending' ? (
          <p className="story-shell__ending-note">The story ends here.</p>
        ) : (
          <>
            {scene.type === 'shop' && <ShopScreen scene={scene} party={party} onPurchase={handlePurchase} />}
            <ChoiceButtons
              choices={availableChoices.map((choice) => ({
                label: choice.label,
                // Previews who will actually act — if the authored actor has
                // died, this already reflects the "no softlock" substitute,
                // so the tag never names someone who can no longer act.
                actorName: scene.type === 'encounter' ? resolveActingMember(party, choice as EncounterChoice).name : undefined,
              }))}
              onChoose={(label) => {
                const choice = availableChoices.find((candidate) => candidate.label === label)
                if (!choice) return
                if (scene.type === 'encounter') handleEncounterChoice(choice as EncounterChoice)
                else handleChoice(choice as Choice)
              }}
            />
          </>
        )}
        <div className="story-shell__footer-links">
          <button type="button" className="story-shell__new-game" onClick={onStartNewGame}>
            Start a new adventure
          </button>
          <button type="button" className="story-shell__skills-toggle" onClick={() => setShowSkillsGuide(true)}>
            Skills Guide
          </button>
        </div>
      </main>
      {showSkillsGuide && <SkillsGuide onClose={() => setShowSkillsGuide(false)} />}
    </div>
  )
}
