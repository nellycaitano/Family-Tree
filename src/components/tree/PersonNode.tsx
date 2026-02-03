import { useState } from 'react'
import { Handle, Position } from 'reactflow'
import type { Relation } from '../../domain/models/Person' 

type PersonNodeData = {
  id: string
  name: string
  firstNames: string
  lastName: string
  gender: 'M' | 'F' | 'other'
  birthDate?: string
  isSelected?: boolean
  onClick?: (id: string) => void
  relations?: Relation[]
}

function formatDate(iso?: string) {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function calcAge(iso?: string) {
  if (!iso) return null
  const birth = new Date(iso)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

const relationLabels: Record<string, string> = {
  parent: 'Parent',
  child: 'Enfant',
  sibling: 'Frère/Sœur',
  conjoint: 'Conjoint',
  'uncle-aunt': 'Oncle/Tante',
  'nephew-niece': 'Neveu/Nièce',
  cousin: 'Cousin(e)',
  grandparent: 'Grand-parent',
  grandchild: 'Petit-enfant',
}

export default function PersonNode({ data }: Readonly<{ data: PersonNodeData }>) {
  const [showTooltip, setShowTooltip] = useState(false)

  const initials = `${data.firstNames[0] ?? ''}${data.lastName[0] ?? ''}`.toUpperCase()
  const age = calcAge(data.birthDate)
  const genderLabel = data.gender === 'M' ? 'Homme' : data.gender === 'F' ? 'Femme' : 'Autre'

  // Grouper les relations par type
  const groupedRelations: Record<string, Relation[]> = {}
  data.relations?.forEach(rel => {
    if (!groupedRelations[rel.relationType]) {
      groupedRelations[rel.relationType] = []
    }
    groupedRelations[rel.relationType].push(rel)
  })

  return (
    <div className="relative">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 z-50 pointer-events-none max-h-96 overflow-y-auto">
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          
          {/* Infos de base */}
          <div className="font-semibold text-sm mb-2">{data.name}</div>
          <div className="space-y-1.5 pb-3 border-b border-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-400">Prénom(s)</span>
              <span className="text-white">{data.firstNames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Nom</span>
              <span className="text-white">{data.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Genre</span>
              <span className="text-white">{genderLabel}</span>
            </div>
            {data.birthDate && (
              <div className="flex justify-between">
                <span className="text-gray-400">Né(e) le</span>
                <span className="text-white">{formatDate(data.birthDate)}</span>
              </div>
            )}
            {age !== null && (
              <div className="flex justify-between">
                <span className="text-gray-400">Âge</span>
                <span className="text-white">{age} ans</span>
              </div>
            )}
          </div>

          {/* Relations */}
          {data.relations && data.relations.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="font-semibold text-xs text-gray-300">Relations</div>
              {Object.keys(groupedRelations).map(relType => (
                <div key={relType} className="space-y-1">
                  <div className="text-gray-400 text-xs">{relationLabels[relType]}</div>
                  {groupedRelations[relType].map(rel => (
                    <div key={rel.personId} className="text-white text-xs pl-2">
                      • {rel.person.firstNames} {rel.person.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Node carte */}
      <button
        className={`bg-white rounded-xl shadow-md px-3 py-2 w-40 text-center cursor-pointer transition-all duration-150
          ${data.isSelected
            ? 'ring-2 ring-blue-500 border border-blue-400 shadow-blue-100'
            : 'border border-gray-200 hover:border-gray-300 hover:shadow-lg'
          }`}
        onClick={() => data.onClick?.(data.id)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />

        {/* Cercle initiales */}
        <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-600 font-semibold text-sm flex items-center justify-center mb-2">
          {initials}
        </div>

        {/* Nom */}
        <div className="text-sm font-semibold truncate">{data.name}</div>

        {/* Âge */}
        {age !== null && (
          <div className="text-xs text-gray-400 mt-0.5">{age} ans</div>
        )}
      </button>
    </div>
  )
}