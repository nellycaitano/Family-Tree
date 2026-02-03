import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
} from 'reactflow'
import PersonNode from './PersonNode'
import type { Person } from '../../domain/models/Person'
// import { calculateGenerations } from '../../domain/services/treeBuilder'


const nodeTypes = {
  person: PersonNode,
}

type Props = {
  readonly persons: Person[]
  readonly edges: Array<{ parentId: string; childId: string }>
  readonly onSelectPerson?: (id: string) => void
}

export default function FamilyTreeCanvas({ persons, edges, onSelectPerson }: Props) {
  //  Nodes 
  const nodes = persons.map((person, index) => ({
    id: person.id,
    type: 'person',
    position: { x: index * 200, y: 0 },
    data: {
      id: person.id,
      name: `${person.firstNames} ${person.name}`,
      onClick: onSelectPerson,
    },
  }))

  //  Edges 
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
