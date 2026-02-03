import { useState } from 'react'
import FamilyTreeCanvas from './components/tree/FamilyTreeCanvas'
import Modal from './components/ui/Modal'
import PersonForm from './components/forms/PersonForm'
import type { Person } from './domain/models/Person'
import { v4 as uuid } from 'uuid'

type ModalMode = 'root' | 'parent' | 'child'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('root')
 const [persons, setPersons] = useState<Person[]>(() => {
  const stored = localStorage.getItem('familyTreePersons')
  return stored ? JSON.parse(stored) : []
})

const [edges, setEdges] = useState<{ parentId: string; childId: string }[]>(() => {
  const stored = localStorage.getItem('familyTreeEdges')
  return stored ? JSON.parse(stored) : []
})
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)

  const updateLocalStorage = (newPersons: Person[], newEdges: Array<{ parentId: string; childId: string }>) => {
  localStorage.setItem('familyTreePersons', JSON.stringify(newPersons))
  localStorage.setItem('familyTreeEdges', JSON.stringify(newEdges))
  }

 const handleAddPerson = (data: { name: string; firstNames: string }) => {
  const newPerson: Person = {
    id: uuid(),
    name: data.name,
    firstNames: data.firstNames,
  }

  const newPersons = [...persons, newPerson]
  const newEdges = [...edges]

  if (modalMode === 'parent' && selectedPersonId) {
    newEdges.push({ parentId: newPerson.id, childId: selectedPersonId })
  } else if (modalMode === 'child' && selectedPersonId) {
    newEdges.push({ parentId: selectedPersonId, childId: newPerson.id })
  }

  setPersons(newPersons)
  setEdges(newEdges)

  updateLocalStorage(newPersons, newEdges)

  setIsModalOpen(false)
}


  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="h-14 border-b bg-white flex items-center px-6">
        <h1 className="text-lg font-semibold">Family Tree</h1>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <aside className="w-72 border-r bg-white p-4">
          {/* Ajouter une racine */}
          <button
            className="w-full rounded-lg bg-black text-white py-2"
            onClick={() => {
              setModalMode('root')
              setIsModalOpen(true)
            }}
          >
            Ajouter une personne
          </button>

          <div className="mt-6 text-sm text-gray-500">
            Sélectionnez une personne pour ajouter un parent ou un enfant.
          </div>

          {/* Ajouter parent / enfant */}
          {selectedPersonId && (
            <div className="mt-4 space-y-2">
              <button
                className="w-full py-2 rounded-lg bg-blue-600 text-white"
                onClick={() => {
                  setModalMode('parent')
                  setIsModalOpen(true)
                }}
              >
                Ajouter un parent
              </button>

              <button
                className="w-full py-2 rounded-lg bg-green-600 text-white"
                onClick={() => {
                  setModalMode('child')
                  setIsModalOpen(true)
                }}
              >
                Ajouter un enfant
              </button>
            </div>
          )}
        </aside>

        {/* Tree canvas */}
        <main className="flex-1 bg-gray-100">
          <FamilyTreeCanvas
            persons={persons}
            edges={edges}
            onSelectPerson={(id) => setSelectedPersonId(id)}
          />
        </main>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        title={
          modalMode === 'root'
            ? 'Ajouter une personne'
            : modalMode === 'parent'
            ? 'Ajouter un parent'
            : 'Ajouter un enfant'
        }
        onClose={() => setIsModalOpen(false)}
      >
        <PersonForm onSubmit={handleAddPerson} />
      </Modal>
    </div>
  )
}

export default App
