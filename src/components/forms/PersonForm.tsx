import { useState } from "react";

type PersonFormProps = {
  onSubmit: (data: { name: string; firstNames: string }) => void
}

export default function PersonForm({ onSubmit }: PersonFormProps) {
  const [name, setName] = useState('')
  const [firstNames, setFirstNames] = useState('')

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ name, firstNames })
      }}
    >
      <input
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Nom"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Prénoms"
        value={firstNames}
        onChange={(e) => setFirstNames(e.target.value)}
        required
      />

      <button className="w-full bg-black text-white py-2 rounded-lg">
        Ajouter
      </button>
    </form>
  )
}

//  <div>
//         <label className="block text-sm font-medium mb-1">
//           Photo (URL)
//         </label>
//         <input
//           type="url"
//           className="w-full rounded-lg border px-3 py-2"
//           placeholder="https://..."
//         />
// </div>