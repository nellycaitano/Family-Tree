import { useState } from 'react'
import { Handle, Position } from 'reactflow'

type PersonNodeData = {
  id: string
  name: string
  firstNames: string
  lastName: string
  gender: 'M' | 'F' | 'other'
  birthDate?: string
  isSelected?: boolean
  onClick?: (id: string) => void
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

export default function PersonNode({ data }: Readonly<{ data: PersonNodeData }>) {
  const [showTooltip, setShowTooltip] = useState(false)

  const initials = `${data.firstNames[0] ?? ''}${data.lastName[0] ?? ''}`.toUpperCase()
  const age = calcAge(data.birthDate)
  const genderLabel = data.gender === 'M' ? 'Homme' : data.gender === 'F' ? 'Femme' : 'Autre'

  return (
    <div className="relative">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 z-50 pointer-events-none">
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          <div className="font-semibold text-sm mb-2">{data.name}</div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Prénom(s)</span>
              <span className="text-white">{data.firstNames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nom</span>
              <span className="text-white">{data.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Genre</span>
              <span className="text-white">{genderLabel}</span>
            </div>
            {data.birthDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Né(e) le</span>
                <span className="text-white">{formatDate(data.birthDate)}</span>
              </div>
            )}
            {age !== null && (
              <div className="flex justify-between">
                <span className="text-gray-500">Âge</span>
                <span className="text-white">{age} ans</span>
              </div>
            )}
          </div>
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