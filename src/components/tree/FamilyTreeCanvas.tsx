import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
} from 'reactflow'
import PersonNode from './PersonNode'
import type { Person,FamilyEdge } from '../../domain/models/Person'

import { calculateLayout } from '../../domain/services/treeBuilder'
import { getRelations } from '../../domain/services/relationService' 

const nodeTypes = {
  person: PersonNode,
}

type Props = {
  readonly persons: Person[]
  readonly edges: FamilyEdge[]
  readonly selectedPersonId: string | null
  readonly onSelectPerson?: (id: string) => void
}

export default function FamilyTreeCanvas({ persons, edges, selectedPersonId, onSelectPerson }: Props) {
  const layout = calculateLayout(persons, edges)

  const nodes = persons.map((person) => {
    const position = layout[person.id] || { x: 0, y: 0 }
    const relations = getRelations(person.id, persons, edges)

    return {
      id: person.id,
      type: 'person',
      position: { x: position.x, y: position.y },
      data: {
        id: person.id,
        name: `${person.firstNames} ${person.name}`,
        firstNames: person.firstNames,
        lastName: person.name,
        gender: person.gender,
        birthDate: person.birthDate,
        isSelected: person.id === selectedPersonId,
        onClick: onSelectPerson,
        relations,
      },
    }
  })

  const rfEdges: Edge[] = edges.map((e) => {
    // Style différent selon le type
    if (e.type === 'conjoint') {
      return {
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        type: 'straight',
        style: { stroke: '#ec4899', strokeWidth: 2 }, // Rose pour conjoints
        animated: false,
      }
    }

    return {
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      type: 'smoothstep',
      style: { stroke: '#6b7280', strokeWidth: 1.5 },
    }
  })

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

