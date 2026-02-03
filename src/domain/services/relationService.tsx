import type { Person, FamilyEdge, Relation } from '../models/Person'

export function getRelations(personId: string, persons: Person[], edges: FamilyEdge[]): Relation[] {
  const relations: Relation[] = []

  // 1. Parents directs
  const parents = edges
    .filter(e => e.type === 'parent-child' && e.targetId === personId)
    .map(e => ({ personId: e.sourceId, relationType: 'parent' as const, person: persons.find(p => p.id === e.sourceId)! }))
    .filter(r => r.person)

  relations.push(...parents)

  // 2. Enfants directs
  const children = edges
    .filter(e => e.type === 'parent-child' && e.sourceId === personId)
    .map(e => ({ personId: e.targetId, relationType: 'child' as const, person: persons.find(p => p.id === e.targetId)! }))
    .filter(r => r.person)

  relations.push(...children)

  // 3. Conjoints
  const conjoints = edges
    .filter(e => e.type === 'conjoint' && (e.sourceId === personId || e.targetId === personId))
    .map(e => {
      const conjointId = e.sourceId === personId ? e.targetId : e.sourceId
      return { personId: conjointId, relationType: 'conjoint' as const, person: persons.find(p => p.id === conjointId)! }
    })
    .filter(r => r.person)

  relations.push(...conjoints)

  // 4. Frères et sœurs (même parents)
  const siblings = new Set<string>()
  parents.forEach(parent => {
    edges
      .filter(e => e.type === 'parent-child' && e.sourceId === parent.personId && e.targetId !== personId)
      .forEach(e => siblings.add(e.targetId))
  })

  siblings.forEach(siblingId => {
    const person = persons.find(p => p.id === siblingId)
    if (person) {
      relations.push({ personId: siblingId, relationType: 'sibling', person })
    }
  })

  // 5. Grands-parents
  const grandparents = new Set<string>()
  parents.forEach(parent => {
    edges
      .filter(e => e.type === 'parent-child' && e.targetId === parent.personId)
      .forEach(e => grandparents.add(e.sourceId))
  })

  grandparents.forEach(gpId => {
    const person = persons.find(p => p.id === gpId)
    if (person) {
      relations.push({ personId: gpId, relationType: 'grandparent', person })
    }
  })

  // 6. Petits-enfants
  const grandchildren = new Set<string>()
  children.forEach(child => {
    edges
      .filter(e => e.type === 'parent-child' && e.sourceId === child.personId)
      .forEach(e => grandchildren.add(e.targetId))
  })

  grandchildren.forEach(gcId => {
    const person = persons.find(p => p.id === gcId)
    if (person) {
      relations.push({ personId: gcId, relationType: 'grandchild', person })
    }
  })

  // 7. Oncles et tantes (frères/sœurs des parents)
  const unclesAunts = new Set<string>()
  parents.forEach(parent => {
    edges
      .filter(e => e.type === 'parent-child' && e.targetId === parent.personId)
      .forEach(gpEdge => {
        edges
          .filter(e => e.type === 'parent-child' && e.sourceId === gpEdge.sourceId && e.targetId !== parent.personId)
          .forEach(e => unclesAunts.add(e.targetId))
      })
  })

  unclesAunts.forEach(uaId => {
    const person = persons.find(p => p.id === uaId)
    if (person) {
      relations.push({ personId: uaId, relationType: 'uncle-aunt', person })
    }
  })

  // 8. Neveux et nièces (enfants des frères/sœurs)
  const nephewsNieces = new Set<string>()
  siblings.forEach(siblingId => {
    edges
      .filter(e => e.type === 'parent-child' && e.sourceId === siblingId)
      .forEach(e => nephewsNieces.add(e.targetId))
  })

  nephewsNieces.forEach(nnId => {
    const person = persons.find(p => p.id === nnId)
    if (person) {
      relations.push({ personId: nnId, relationType: 'nephew-niece', person })
    }
  })

  // 9. Cousins (enfants des oncles/tantes)
  const cousins = new Set<string>()
  unclesAunts.forEach(uaId => {
    edges
      .filter(e => e.type === 'parent-child' && e.sourceId === uaId)
      .forEach(e => cousins.add(e.targetId))
  })

  cousins.forEach(cousinId => {
    const person = persons.find(p => p.id === cousinId)
    if (person) {
      relations.push({ personId: cousinId, relationType: 'cousin', person })
    }
  })

  return relations
}