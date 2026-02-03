import type { Person, FamilyEdge } from "../models/Person"

type LayoutNode = {
  id: string
  generation: number
  x: number
  y: number
}

export function calculateLayout(persons: Person[], edges: FamilyEdge[]): Record<string, LayoutNode> {
  const layout: Record<string, LayoutNode> = {}
  const generations: Record<string, number> = {}

  // 1. Calculer les générations via DFS
  function assignGeneration(personId: string, gen: number) {
    if (generations[personId] !== undefined && generations[personId] >= gen) return
    generations[personId] = gen

    // Enfants
    edges
      .filter(e => e.type === 'parent-child' && e.sourceId === personId)
      .forEach(e => assignGeneration(e.targetId, gen + 1))

    // Conjoints restent à la même génération
    edges
      .filter(e => e.type === 'conjoint' && (e.sourceId === personId || e.targetId === personId))
      .forEach(e => {
        const conjointId = e.sourceId === personId ? e.targetId : e.sourceId
        assignGeneration(conjointId, gen)
      })
  }

  // Racines = personnes sans parents
  const allChildIds = new Set(edges.filter(e => e.type === 'parent-child').map(e => e.targetId))
  const roots = persons.filter(p => !allChildIds.has(p.id))
  roots.forEach(root => assignGeneration(root.id, 0))

  // 2. Regrouper par génération
  const genGroups: Record<number, string[]> = {}
  persons.forEach(p => {
    const gen = generations[p.id] ?? 0
    if (!genGroups[gen]) genGroups[gen] = []
    genGroups[gen].push(p.id)
  })

  // 3. Organiser les conjoints côte à côte
  const processed = new Set<string>()
  const genOrdered: Record<number, string[]> = {}

  Object.keys(genGroups).forEach(genKey => {
    const gen = Number(genKey)
    genOrdered[gen] = []

    genGroups[gen].forEach(personId => {
      if (processed.has(personId)) return

      // Vérifier si cette personne a un conjoint
      const conjointEdge = edges.find(
        e => e.type === 'conjoint' && (e.sourceId === personId || e.targetId === personId)
      )

      if (conjointEdge) {
        const conjointId = conjointEdge.sourceId === personId ? conjointEdge.targetId : conjointEdge.sourceId
        
        // Ajouter les deux conjoints ensemble
        genOrdered[gen].push(personId)
        if (!processed.has(conjointId)) {
          genOrdered[gen].push(conjointId)
        }
        processed.add(personId)
        processed.add(conjointId)
      } else {
        genOrdered[gen].push(personId)
        processed.add(personId)
      }
    })
  })

  // 4. Calculer les positions X et Y
  Object.keys(genOrdered).forEach(genKey => {
    const gen = Number(genKey)
    const people = genOrdered[gen]
    const totalInGen = people.length

    people.forEach((personId, index) => {
      layout[personId] = {
        id: personId,
        generation: gen,
        x: (index - (totalInGen - 1) / 2) * 220,
        y: gen * 200,
      }
    })
  })

  return layout
}