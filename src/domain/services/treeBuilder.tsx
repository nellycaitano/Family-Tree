import type { Person } from '../models/Person'

type EdgeData = { parentId: string; childId: string }

export function calculateGenerations(persons: Person[], edges: EdgeData[]) {
  const generations: Record<string, number> = {}

  function dfs(personId: string, gen: number) {
    if (generations[personId] !== undefined && generations[personId] >= gen) return
    generations[personId] = gen

    // enfants
    edges
      .filter(e => e.parentId === personId)
      .forEach(e => dfs(e.childId, gen + 1))
  }

  // Commencer par les racines (personnes sans parent)
  const allChildIds = new Set(edges.map(e => e.childId))
  const roots = persons.filter(p => !allChildIds.has(p.id))
  roots.forEach(root => dfs(root.id, 0))

  return generations
}
