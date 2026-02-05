import { useState } from 'react'
import FamilyTreeCanvas from './components/tree/FamilyTreeCanvas'
import Modal from './components/ui/Modal'
import PersonForm from './components/forms/PersonForm'
import type { Person, FamilyEdge } from './domain/models/Person'  
import { FaUserPlus, FaUserTie, FaChild, FaHeart } from 'react-icons/fa'
import { v4 as uuid } from 'uuid'
import {
  validateAddParent,
  validateAddChild,
  validateAddConjoint,
  validateNoDuplicate,
} from './domain/services/validationService'

type ModalMode = 'root' | 'parent' | 'child' | 'conjoint'

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
        return oldEdges.map((e: { parentId: string; childId: string }) => ({
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
  const [validationError, setValidationError] = useState<string | null>(null)
  
  // Mode connexion entre deux personnes existantes
  const [isConnectionMode, setIsConnectionMode] = useState(false)
  const [firstSelectedPerson, setFirstSelectedPerson] = useState<string | null>(null)
  const [secondSelectedPerson, setSecondSelectedPerson] = useState<string | null>(null)
  const [showConnectionModal, setShowConnectionModal] = useState(false)

  const updateLocalStorage = (newPersons: Person[], newEdges: FamilyEdge[]) => {
    localStorage.setItem('familyTreePersons', JSON.stringify(newPersons))
    localStorage.setItem('familyTreeEdges', JSON.stringify(newEdges))
  }

  const handlePersonClick = (id: string) => {
    if (isConnectionMode) {
      // Mode connexion
      if (!firstSelectedPerson) {
        setFirstSelectedPerson(id)
      } else if (id !== firstSelectedPerson) {
        setSecondSelectedPerson(id)
        setShowConnectionModal(true)
      }
    } else {
      // Mode normal
      setSelectedPersonId((prev) => (prev === id ? null : id))
    }
  }

  const cancelConnectionMode = () => {
    setIsConnectionMode(false)
    setFirstSelectedPerson(null)
    setSecondSelectedPerson(null)
    setShowConnectionModal(false)
    setValidationError(null)
  }

  const handleCreateConnection = (relationType: 'parent-child-1' | 'parent-child-2' | 'conjoint') => {
    if (!firstSelectedPerson || !secondSelectedPerson) return

    setValidationError(null)

    const newEdges = [...edges]
    let sourceId = ''
    let targetId = ''
    let edgeType: 'parent-child' | 'conjoint' = 'parent-child'

    // Déterminer la relation
    if (relationType === 'parent-child-1') {
      // firstSelectedPerson est le parent de secondSelectedPerson
      sourceId = firstSelectedPerson
      targetId = secondSelectedPerson
      edgeType = 'parent-child'

      const person1 = persons.find(p => p.id === firstSelectedPerson)
      const validation = validateAddChild(firstSelectedPerson, person1?.birthDate, persons)
      if (!validation.isValid) {
        setValidationError(validation.errorMessage || "Erreur de validation")
        return
      }

      const parentValidation = validateAddParent(secondSelectedPerson, person1?.birthDate, persons, edges)
      if (!parentValidation.isValid) {
        setValidationError(parentValidation.errorMessage || "Erreur de validation")
        return
      }
    } else if (relationType === 'parent-child-2') {
      // secondSelectedPerson est le parent de firstSelectedPerson
      sourceId = secondSelectedPerson
      targetId = firstSelectedPerson
      edgeType = 'parent-child'

      const person2 = persons.find(p => p.id === secondSelectedPerson)
      const validation = validateAddChild(secondSelectedPerson, person2?.birthDate, persons)
      if (!validation.isValid) {
        setValidationError(validation.errorMessage || "Erreur de validation")
        return
      }

      const parentValidation = validateAddParent(firstSelectedPerson, person2?.birthDate, persons, edges)
      if (!parentValidation.isValid) {
        setValidationError(parentValidation.errorMessage || "Erreur de validation")
        return
      }
    } else if (relationType === 'conjoint') {
      sourceId = firstSelectedPerson
      targetId = secondSelectedPerson
      edgeType = 'conjoint'

      const validation = validateAddConjoint(firstSelectedPerson, secondSelectedPerson, persons, edges)
      if (!validation.isValid) {
        setValidationError(validation.errorMessage || "Erreur de validation")
        return
      }
    }

    // Vérifier les doublons
    const duplicateCheck = validateNoDuplicate(sourceId, targetId, edgeType, edges)
    if (!duplicateCheck.isValid) {
      setValidationError(duplicateCheck.errorMessage || "Cette relation existe déjà")
      return
    }

    // Créer la relation
    newEdges.push({
      id: uuid(),
      sourceId,
      targetId,
      type: edgeType,
    })

    setEdges(newEdges)
    updateLocalStorage(persons, newEdges)
    cancelConnectionMode()
  }

  const handleAddPerson = (data: { name: string; firstNames: string; gender: 'M' | 'F' | 'other'; birthDate?: string }) => {
    // Réinitialiser l'erreur
    setValidationError(null)

    const newPerson: Person = {
      id: uuid(),
      name: data.name,
      firstNames: data.firstNames,
      gender: data.gender,
      birthDate: data.birthDate,
    }

    // VALIDATIONS
    if (modalMode === 'parent' && selectedPersonId) {
      const validation = validateAddParent(selectedPersonId, data.birthDate, persons, edges)
      if (!validation.isValid) {
        setValidationError(validation.errorMessage || "Erreur de validation")
        return
      }

      // Vérifier les doublons
      const duplicateCheck = validateNoDuplicate(newPerson.id, selectedPersonId, 'parent-child', edges)
      if (!duplicateCheck.isValid) {
        setValidationError(duplicateCheck.errorMessage || "Cette relation existe déjà")
        return
      }
    } else if (modalMode === 'child' && selectedPersonId) {
      const validation = validateAddChild(selectedPersonId, data.birthDate, persons)
      if (!validation.isValid) {
        setValidationError(validation.errorMessage || "Erreur de validation")
        return
      }
    } else if (modalMode === 'conjoint' && selectedPersonId) {
      const validation = validateAddConjoint(selectedPersonId, newPerson.id, persons, edges)
      if (!validation.isValid) {
        setValidationError(validation.errorMessage || "Erreur de validation")
        return
      }
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

      // 🎯 Vérifier si le parent a un conjoint
      const conjointEdge = edges.find(
        e => e.type === 'conjoint' && (e.sourceId === selectedPersonId || e.targetId === selectedPersonId)
      )

      if (conjointEdge) {
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
    setValidationError(null)
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

          {/* Bouton Connecter deux personnes */}
          {persons.length >= 2 && !isConnectionMode && (
            <button
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-blue-500 text-white py-2 hover:bg-blue-600 transition mt-3"
              onClick={() => {
                setIsConnectionMode(true)
                setSelectedPersonId(null)
              }}
            >
              🔗 Connecter deux personnes
            </button>
          )}

          {/* Mode connexion actif */}
          {isConnectionMode && (
            <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <div className="text-sm font-semibold text-blue-900 mb-2">
                Mode Connexion activé
              </div>
              <div className="text-xs text-blue-700 mb-3">
                {!firstSelectedPerson
                  ? "1. Cliquez sur la première personne"
                  : !secondSelectedPerson
                  ? "2. Cliquez sur la deuxième personne"
                  : "Choisissez la relation"}
              </div>
              {firstSelectedPerson && (
                <div className="text-xs bg-white p-2 rounded mb-2">
                  Personne 1 : <strong>{persons.find(p => p.id === firstSelectedPerson)?.firstNames}</strong>
                </div>
              )}
              <button
                className="w-full py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                onClick={cancelConnectionMode}
              >
                Annuler
              </button>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500">
            {isConnectionMode
              ? "Sélectionnez deux personnes à connecter"
              : "Sélectionnez une personne pour ajouter un parent, un enfant ou un conjoint."}
          </div>

          {/* Ajouter parent / enfant / conjoint */}
          {selectedPersonId && !isConnectionMode && (
            <div className="mt-4 flex flex-col gap-2">
              {(() => {
                const existingParents = edges.filter(
                  e => e.type === 'parent-child' && e.targetId === selectedPersonId
                )
                const hasMaxParents = existingParents.length >= 2

                const existingConjoint = edges.find(
                  e => e.type === 'conjoint' && (e.sourceId === selectedPersonId || e.targetId === selectedPersonId)
                )
                const hasConjoint = !!existingConjoint

                return (
                  <>
                    <button
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                        hasMaxParents
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-400 text-white hover:bg-purple-500'
                      }`}
                      onClick={() => {
                        if (!hasMaxParents) {
                          setModalMode('parent')
                          setIsModalOpen(true)
                        }
                      }}
                      disabled={hasMaxParents}
                      title={hasMaxParents ? "Cette personne a déjà 2 parents" : ""}
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
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                        hasConjoint
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-pink-500 text-white hover:bg-pink-600'
                      }`}
                      onClick={() => {
                        if (!hasConjoint) {
                          setModalMode('conjoint')
                          setIsModalOpen(true)
                        }
                      }}
                      disabled={hasConjoint}
                      title={hasConjoint ? "Cette personne a déjà un conjoint" : ""}
                    >
                      <FaHeart /> Ajouter un conjoint
                    </button>
                  </>
                )
              })()}
            </div>
          )}
        </aside>

        {/* Tree canvas */}
        <main className="flex-1 bg-gray-100">
          <FamilyTreeCanvas
            persons={persons}
            edges={edges}
            selectedPersonId={isConnectionMode ? firstSelectedPerson : selectedPersonId}
            onSelectPerson={handlePersonClick}
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
        onClose={() => {
          setIsModalOpen(false)
          setValidationError(null)
        }}
      >
        {/* Message d'erreur de validation */}
        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            ⚠️ {validationError}
          </div>
        )}

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

      {/* Modal de connexion entre deux personnes */}
      <Modal
        isOpen={showConnectionModal}
        title="Choisir la relation"
        onClose={cancelConnectionMode}
      >
        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            ⚠️ {validationError}
          </div>
        )}

        {firstSelectedPerson && secondSelectedPerson && (() => {
          const person1 = persons.find(p => p.id === firstSelectedPerson)
          const person2 = persons.find(p => p.id === secondSelectedPerson)

          return (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <strong>{person1?.firstNames} {person1?.name}</strong>
                {" et "}
                <strong>{person2?.firstNames} {person2?.name}</strong>
              </div>

              <div className="space-y-2">
                <button
                  className="w-full p-3 text-left border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition"
                  onClick={() => handleCreateConnection('parent-child-1')}
                >
                  <div className="font-semibold text-sm">
                    {person1?.firstNames} est le parent de {person2?.firstNames}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Crée une relation parent → enfant
                  </div>
                </button>

                <button
                  className="w-full p-3 text-left border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition"
                  onClick={() => handleCreateConnection('parent-child-2')}
                >
                  <div className="font-semibold text-sm">
                    {person2?.firstNames} est le parent de {person1?.firstNames}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Crée une relation parent → enfant
                  </div>
                </button>

                <button
                  className="w-full p-3 text-left border-2 border-gray-200 rounded-lg hover:border-pink-400 hover:bg-pink-50 transition"
                  onClick={() => handleCreateConnection('conjoint')}
                >
                  <div className="font-semibold text-sm">
                    {person1?.firstNames} et {person2?.firstNames} sont conjoints
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Crée une relation de couple
                  </div>
                </button>
              </div>

              <button
                className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                onClick={cancelConnectionMode}
              >
                Annuler
              </button>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

export default App