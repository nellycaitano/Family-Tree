import { useState } from 'react'
import FamilyTreeCanvas from './components/tree/FamilyTreeCanvas'
import Modal from './components/ui/Modal'
import PersonForm from './components/forms/PersonForm'
import type { Person,FamilyEdge } from './domain/models/Person'
import { FaUserPlus, FaUserTie, FaChild, FaHeart } from 'react-icons/fa'
import { v4 as uuid } from 'uuid'

type ModalMode = 'root' | 'parent' | 'child' | 'conjoint'

type OldEdgeFormat = {
  parentId: string
  childId: string
}

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('root')
  
  const [persons, setPersons] = useState<Person[]>(() => {
    const stored = localStorage.getItem('familyTreePersons')
    return stored ? JSON.parse(stored) : []
  })

  const [edges, setEdges] = useState<FamilyEdge[]>(() => {
    const stored = localStorage.getItem('familyTreeEdges')
    if (stored) {
      const oldEdges = JSON.parse(stored)
      // Migration depuis l'ancien format
      if (oldEdges.length > 0 && !oldEdges[0].type) {
        return oldEdges.map((e: OldEdgeFormat) => ({
          id: uuid(),
          sourceId: e.parentId,
          targetId: e.childId,
          type: 'parent-child' as const,
        }))
      }
      return oldEdges
    }
    return []
  })

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)

  const updateLocalStorage = (newPersons: Person[], newEdges: FamilyEdge[]) => {
    localStorage.setItem('familyTreePersons', JSON.stringify(newPersons))
    localStorage.setItem('familyTreeEdges', JSON.stringify(newEdges))
  }

  const handleAddPerson = (data: { name: string; firstNames: string; gender: 'M' | 'F' | 'other'; birthDate?: string }) => {
    const newPerson: Person = {
      id: uuid(),
      name: data.name,
      firstNames: data.firstNames,
      gender: data.gender,
      birthDate: data.birthDate,
    }

    const newPersons = [...persons, newPerson]
    const newEdges = [...edges]

    if (modalMode === 'parent' && selectedPersonId) {
      newEdges.push({
        id: uuid(),
        sourceId: newPerson.id,
        targetId: selectedPersonId,
        type: 'parent-child',
      })
    } else if (modalMode === 'child' && selectedPersonId) {
      // Ajouter l'edge du parent sélectionné vers l'enfant
      newEdges.push({
        id: uuid(),
        sourceId: selectedPersonId,
        targetId: newPerson.id,
        type: 'parent-child',
      })

      // Vérifier si le parent a un conjoint
      const conjointEdge = edges.find(
        e => e.type === 'conjoint' && (e.sourceId === selectedPersonId || e.targetId === selectedPersonId)
      )

      if (conjointEdge) {
        // Trouver l'ID du conjoint
        const conjointId = conjointEdge.sourceId === selectedPersonId 
          ? conjointEdge.targetId 
          : conjointEdge.sourceId

        // Ajouter aussi un edge du conjoint vers l'enfant
        newEdges.push({
          id: uuid(),
          sourceId: conjointId,
          targetId: newPerson.id,
          type: 'parent-child',
        })
      }
    } else if (modalMode === 'conjoint' && selectedPersonId) {
      newEdges.push({
        id: uuid(),
        sourceId: selectedPersonId,
        targetId: newPerson.id,
        type: 'conjoint',
      })
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
        <aside className="w-72 border-r bg-white p-4 flex flex-col">
          {/* Ajouter une racine */}
          <button
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-black text-white py-2 hover:bg-gray-800 transition"
            onClick={() => {
              setModalMode('root')
              setIsModalOpen(true)
            }}
          >
            <FaUserPlus /> Ajouter une personne
          </button>

          <div className="mt-6 text-sm text-gray-500">
            Sélectionnez une personne pour ajouter un parent, un enfant ou un conjoint.
          </div>

          <div className="mt-6 text-sm text-gray-500">
            Survolez sur une personne pour voir ses informations.
          </div>

          {/* Ajouter parent / enfant / conjoint */}
          {selectedPersonId && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-400 text-white hover:bg-purple-500 transition"
                onClick={() => {
                  setModalMode('parent')
                  setIsModalOpen(true)
                }}
              >
                <FaUserTie /> Ajouter un parent
              </button>

              <button
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[#81A936] text-white hover:bg-lime-600 transition"
                onClick={() => {
                  setModalMode('child')
                  setIsModalOpen(true)
                }}
              >
                <FaChild /> Ajouter un enfant
              </button>

              <button
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition"
                onClick={() => {
                  setModalMode('conjoint')
                  setIsModalOpen(true)
                }}
              >
                <FaHeart /> Ajouter un conjoint
              </button>
            </div>
          )}
        </aside>

        {/* Tree canvas */}
        <main className="flex-1 bg-gray-100">
          <FamilyTreeCanvas
            persons={persons}
            edges={edges}
            selectedPersonId={selectedPersonId}
            onSelectPerson={(id) => setSelectedPersonId((prev) => (prev === id ? null : id))}
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
            : modalMode === 'child'
            ? 'Ajouter un enfant'
            : 'Ajouter un conjoint'
        }
        onClose={() => setIsModalOpen(false)}
      >
        {/* Message info si ajout enfant avec conjoint détecté */}
        {modalMode === 'child' && selectedPersonId && edges.find(
          e => e.type === 'conjoint' && (e.sourceId === selectedPersonId || e.targetId === selectedPersonId)
        ) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            ℹ️ Les deux parents seront automatiquement liés à cet enfant.
          </div>
        )}
        <PersonForm onSubmit={handleAddPerson} />
      </Modal>
    </div>
  )
}

export default App