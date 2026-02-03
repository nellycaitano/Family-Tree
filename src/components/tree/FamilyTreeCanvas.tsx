import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
} from 'reactflow'
import PersonNode from './PersonNode'
import type { Person } from '../../domain/models/Person'
import { calculateGenerations } from '../../domain/services/treeBuilder'

const nodeTypes = {
  person: PersonNode,
}

type Props = {
  readonly persons: Person[]
  readonly edges: Array<{ parentId: string; childId: string }>
  readonly onSelectPerson?: (id: string) => void
}

export default function FamilyTreeCanvas({ persons, edges, onSelectPerson }: Props) {
  const generations = calculateGenerations(persons, edges)

  // Regrouper les personnes par génération pour le x
  const genGroups: Record<number, string[]> = {}
  persons.forEach((p) => {
    const gen = generations[p.id] ?? 0 // fallback à 0 si undefined
    if (!genGroups[gen]) genGroups[gen] = []
    genGroups[gen].push(p.id)
  })

  // Compteur d'index horizontal par génération
  const genXCount: Record<number, number> = {}

  const nodes = persons.map((person) => {
    const gen = generations[person.id] ?? 0
    const indexInGen = genXCount[gen] ?? 0
    genXCount[gen] = indexInGen + 1
    const totalInGen = genGroups[gen].length

    return {
      id: person.id,
      type: 'person',
      position: {
        // Centre chaque génération horizontalement
        x: (indexInGen - (totalInGen - 1) / 2) * 220,
        y: gen * 180,
      },
      data: {
        id: person.id,
        name: `${person.firstNames} ${person.name}`,
        onClick: onSelectPerson,
      },
    }
  })

  const rfEdges: Edge[] = edges.map((e) => ({
    id: `${e.parentId}-${e.childId}`,
    source: e.parentId,
    target: e.childId,
    type: 'smoothstep',
  }))

  return (
    <div className="h-full w-full">
      <ReactFlow nodes={nodes} edges={rfEdges} nodeTypes={nodeTypes} fitView>
        <Background gap={16} />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  )
}