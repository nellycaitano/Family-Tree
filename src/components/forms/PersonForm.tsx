import { useState } from "react";

type PersonFormProps = {
  onSubmit: (data: { name: string; firstNames: string; gender: 'M' | 'F' | 'other'; birthDate?: string }) => void
}

export default function PersonForm({ onSubmit }: PersonFormProps) {
  const [name, setName] = useState('')
  const [firstNames, setFirstNames] = useState('')
  const [gender, setGender] = useState<'M' | 'F' | 'other'>('M')
  const [birthDate, setBirthDate] = useState('')

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          name,
          firstNames,
          gender,
          birthDate: birthDate || undefined,
        })
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

      {/* Genre */}
      <div className="flex gap-2">
        {(['M', 'F', 'other'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGender(g)}
            className={`flex-1 py-2 rounded-lg border text-sm transition-colors
              ${gender === g
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
          >
            {g === 'M' ? 'Homme' : g === 'F' ? 'Femme' : 'Autre'}
          </button>
        ))}
      </div>

      {/* Date de naissance */}
      <div className="flex flex-col gap-1">
        <label htmlFor="birthDate" className="text-sm text-gray-500">Date de naissance (optionnel)</label>
        <input
          id="birthDate"
          type="date"
          className="w-full border rounded-lg px-3 py-2 text-sm"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>

      <button className="w-full bg-black text-white py-2 rounded-lg">
        Ajouter
      </button>
    </form>
  )
}