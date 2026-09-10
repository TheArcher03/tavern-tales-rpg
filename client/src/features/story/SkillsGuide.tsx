import { SKILL_ABILITIES, type SkillName } from '@tavern-tales/shared'

// Plain-English explanations for players new to D&D-style skill checks —
// what each skill actually represents when a choice button names one,
// beyond the ability score it's tied to.
const SKILL_DESCRIPTIONS: Record<SkillName, string> = {
  Athletics: 'Climbing, jumping, swimming, or forcing your way through something physical.',
  Acrobatics: 'Staying on your feet — balance, tumbling, squeezing through a tight or precarious spot.',
  'Sleight of Hand': 'Quick, precise hands — picking a lock, a pocket, or palming something unseen.',
  Stealth: 'Staying hidden and quiet — sneaking past guards or avoiding notice entirely.',
  Arcana: 'Knowledge of magic — spells, wards, magical creatures, and how they work.',
  History: 'Recalling past events, old conflicts, and how the world got to be the way it is.',
  Investigation: 'Piecing together clues, searching a scene methodically, deducing what happened.',
  Nature: 'Knowledge of terrain, plants, weather, and natural (non-magical) creatures.',
  Religion: 'Knowledge of gods, rites, holy symbols, and religious lore.',
  'Animal Handling': 'Calming, controlling, or reading the intent of an animal.',
  Insight: 'Reading a person\'s true intentions — are they lying, scared, sincere?',
  Medicine: 'Treating wounds, diagnosing an ailment, stabilizing someone hurt.',
  Perception: 'Noticing things — a sound, a hidden door, movement in the dark.',
  Survival: 'Tracking, navigating the wild, foraging, enduring harsh conditions.',
  Deception: 'Convincingly lying or misleading someone.',
  Intimidation: 'Coercing or unsettling someone through threat or force of presence.',
  Performance: 'Entertaining a crowd — music, acting, storytelling, spectacle.',
  Persuasion: 'Honestly convincing someone through reason, charm, or appeal.',
}

const SKILL_ORDER = Object.keys(SKILL_DESCRIPTIONS) as SkillName[]

export function SkillsGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="skills-guide__backdrop" onClick={onClose}>
      <div className="skills-guide" onClick={(event) => event.stopPropagation()}>
        <div className="skills-guide__header">
          <h2>Skills Guide</h2>
          <button type="button" className="skills-guide__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="skills-guide__intro">
          Each skill is tied to one ability score — that's whose stat actually helps. A choice's tag on screen
          already shows the acting character's real modifier for it.
        </p>
        <dl className="skills-guide__list">
          {SKILL_ORDER.map((skill) => (
            <div key={skill} className="skills-guide__entry">
              <dt>
                {skill} <span className="skills-guide__ability">({SKILL_ABILITIES[skill]})</span>
              </dt>
              <dd>{SKILL_DESCRIPTIONS[skill]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
