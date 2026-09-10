import { alignmentLabel, getCharacterClass, getRace, type Character, type PartyState } from '@tavern-tales/shared'

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function MemberCard({ member }: { member: Character }) {
  const race = getRace(member.raceId)
  const characterClass = getCharacterClass(member.classId)

  return (
    <div className="party-panel__member">
      <h3 className="party-panel__member-name">
        {member.name}
        {member.role === 'companion' && <span className="party-panel__companion-tag">Companion</span>}
      </h3>
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

export function PartyPanel({ party }: { party: PartyState }) {
  return (
    <aside className="party-panel">
      {party.members.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
      <div className="party-panel__treasury">
        <p className="party-panel__gold">💰 {party.sharedGold} gold</p>
        {party.sharedTreasure.length > 0 && (
          <ul className="party-panel__treasure">
            {party.sharedTreasure.map((item) => (
              <li key={item.id} title={item.description}>
                {item.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
