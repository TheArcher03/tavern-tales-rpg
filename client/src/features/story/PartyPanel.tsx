import { useState } from 'react'
import { ABILITY_NAMES, alignmentLabel, getCharacterClass, getRace, type Character, type PartyState } from '@tavern-tales/shared'

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function DeadMemberCard({ member }: { member: Character }) {
  return (
    <div className="party-panel__member party-panel__member--dead">
      <p className="party-panel__member-tombstone">🪦</p>
      <p className="party-panel__member-name">{member.name}</p>
      <p className="party-panel__member-fallen">Fallen</p>
    </div>
  )
}

function LivingMemberCard({ member, expanded, onToggle }: { member: Character; expanded: boolean; onToggle: () => void }) {
  const race = getRace(member.raceId)
  const characterClass = getCharacterClass(member.classId)

  return (
    <div className="party-panel__member">
      <button
        type="button"
        className="party-panel__member-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h3 className="party-panel__member-name">
          {member.name}
          {member.role === 'companion' && <span className="party-panel__companion-tag">Companion</span>}
        </h3>
        <span className="party-panel__member-toggle">{expanded ? '▾' : '▸'}</span>
      </button>
      <p className="party-panel__member-subtitle">
        Level {member.level} {race.name} {characterClass.name}
      </p>
      <p className="party-panel__member-alignment">{alignmentLabel(member.alignment)}</p>
      <dl className="party-panel__member-stats">
        <div>
          <dt>HP</dt>
          <dd>
            {member.hitPoints.current}/{member.hitPoints.max}
          </dd>
        </div>
        <div>
          <dt>AC</dt>
          <dd>{member.armorClass}</dd>
        </div>
        <div>
          <dt>Prof</dt>
          <dd>{formatModifier(member.proficiencyBonus)}</dd>
        </div>
      </dl>
      {expanded && (
        <ul className="party-panel__abilities">
          {ABILITY_NAMES.map((ability) => (
            <li key={ability}>
              <span className="party-panel__ability-name">{ability}</span>
              <span>
                {member.abilityScores[ability]} ({formatModifier(member.abilityModifiers[ability])})
              </span>
            </li>
          ))}
        </ul>
      )}
      {member.curses.length > 0 && (
        <ul className="party-panel__curses">
          {member.curses.map((curse) => (
            <li key={curse.id} title={curse.description}>
              💀 {curse.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface PartyPanelProps {
  party: PartyState
  onUseItem: (itemId: string) => void
}

export function PartyPanel({ party, onUseItem }: PartyPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <aside className="party-panel">
      {party.members.map((member) =>
        member.status === 'dead' ? (
          <DeadMemberCard key={member.id} member={member} />
        ) : (
          <LivingMemberCard
            key={member.id}
            member={member}
            expanded={expandedIds.has(member.id)}
            onToggle={() => toggleExpanded(member.id)}
          />
        ),
      )}
      <div className="party-panel__treasury">
        <p className="party-panel__gold">💰 {party.sharedGold} gold</p>
        {party.sharedTreasure.length > 0 && (
          <ul className="party-panel__treasure">
            {party.sharedTreasure.map((item, index) => (
              <li key={`${item.id}-${index}`} className="party-panel__treasure-item">
                <span title={item.description}>{item.name}</span>
                {item.usable && (
                  <button type="button" className="party-panel__treasure-use" onClick={() => onUseItem(item.id)}>
                    Use
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
