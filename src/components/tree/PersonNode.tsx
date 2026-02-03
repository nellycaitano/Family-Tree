import { Handle, Position } from 'reactflow'

type PersonNodeData = {
  id: string
  name: string
  subtitle?: string
  photoUrl?: string
  onClick?: (id: string) => void
}


export default function PersonNode({ data }: Readonly<{ data: PersonNodeData }>) {
  return (
    <button
        className="group bg-white rounded-xl shadow-md border px-3 py-2 w-40 text-center cursor-pointer"
        onClick={() => data.onClick?.(data.id)}
    >

      {/* Handles (relations) */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      {/* Photo */}
      <div className="w-12 h-12 mx-auto rounded-full bg-gray-200 overflow-hidden mb-2">
        {data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt={data.name}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>

      {/* Name */}
      <div className="text-sm font-semibold">{data.name}</div>

      {/* Subtitle */}
      {data.subtitle && (
        <div className="text-xs text-gray-500">{data.subtitle}</div>
      )}

      {/* Hover actions placeholder */}
      <div className="opacity-0 group-hover:opacity-100 transition text-xs mt-2 text-gray-400">
        Cliquer pour actions
      </div>
    </button>
  )
}
