import type { Person, FamilyEdge } from '../models/Person'

export type ValidationResult = {
  isValid: boolean
  errorMessage?: string
}

/**
 * Valider l'ajout d'un parent
 */
export function validateAddParent(
  childId: string,
  newParentBirthDate: string | undefined,
  persons: Person[],
  edges: FamilyEdge[]
): ValidationResult {
  const child = persons.find(p => p.id === childId)
  if (!child) return { isValid: false, errorMessage: "Enfant introuvable" }

  // 1. Vérifier qu'il n'a pas déjà 2 parents
  const existingParents = edges.filter(
    e => e.type === 'parent-child' && e.targetId === childId
  )

  if (existingParents.length >= 2) {
    return {
      isValid: false,
      errorMessage: "Cette personne a déjà 2 parents. Impossible d'en ajouter un troisième."
    }
  }

  // 2. Vérifier la cohérence des âges (parent doit avoir au moins 15 ans de plus)
  if (child.birthDate && newParentBirthDate) {
    const childDate = new Date(child.birthDate)
    const parentDate = new Date(newParentBirthDate)
    const ageDiffYears = (childDate.getTime() - parentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    if (ageDiffYears < 15) {
      return {
        isValid: false,
        errorMessage: "Le parent doit avoir au moins 15 ans de plus que l'enfant."
      }
    }

    // Vérifier aussi que le parent n'est pas plus jeune
    if (ageDiffYears < 0) {
      return {
        isValid: false,
        errorMessage: "Le parent ne peut pas être plus jeune que l'enfant."
      }
    }
  }

  return { isValid: true }
}

/**
 * Valider l'ajout d'un enfant
 */
export function validateAddChild(
  parentId: string,
  newChildBirthDate: string | undefined,
  persons: Person[]
): ValidationResult {
  const parent = persons.find(p => p.id === parentId)
  if (!parent) return { isValid: false, errorMessage: "Parent introuvable" }

  // Vérifier la cohérence des âges (parent doit avoir au moins 15 ans de plus)
  if (parent.birthDate && newChildBirthDate) {
    const parentDate = new Date(parent.birthDate)
    const childDate = new Date(newChildBirthDate)
    const ageDiffYears = (childDate.getTime() - parentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    if (ageDiffYears < 15) {
      return {
        isValid: false,
        errorMessage: "Le parent doit avoir au moins 15 ans de plus que l'enfant."
      }
    }

    // Vérifier que l'enfant n'est pas plus vieux
    if (ageDiffYears < 0) {
      return {
        isValid: false,
        errorMessage: "L'enfant ne peut pas être plus vieux que le parent."
      }
    }
  }

  return { isValid: true }
}

/**
 * Valider l'ajout d'un conjoint
 */
export function validateAddConjoint(
  personId: string,
  newConjointId: string,
  persons: Person[],
  edges: FamilyEdge[]
): ValidationResult {
  // 1. Vérifier qu'il n'a pas déjà un conjoint actif
  const existingConjoint = edges.find(
    e => e.type === 'conjoint' && (e.sourceId === personId || e.targetId === personId)
  )

  if (existingConjoint) {
    const conjointId = existingConjoint.sourceId === personId 
      ? existingConjoint.targetId 
      : existingConjoint.sourceId
    const conjoint = persons.find(p => p.id === conjointId)
    
    return {
      isValid: false,
      errorMessage: `Cette personne a déjà un conjoint : ${conjoint?.firstNames} ${conjoint?.name}`
    }
  }

  // 2. Vérifier qu'on n'ajoute pas un parent comme conjoint
  const isParent = edges.some(
    e => e.type === 'parent-child' && 
         ((e.sourceId === personId && e.targetId === newConjointId) ||
          (e.sourceId === newConjointId && e.targetId === personId))
  )

  if (isParent) {
    return {
      isValid: false,
      errorMessage: "Impossible d'ajouter un parent ou un enfant comme conjoint."
    }
  }

  // 3. Vérifier qu'on n'ajoute pas un frère/sœur comme conjoint
  const person = persons.find(p => p.id === personId)
  const conjoint = persons.find(p => p.id === newConjointId)

  if (person && conjoint) {
    // Trouver les parents communs
    const personParents = edges
      .filter(e => e.type === 'parent-child' && e.targetId === personId)
      .map(e => e.sourceId)

    const conjointParents = edges
      .filter(e => e.type === 'parent-child' && e.targetId === newConjointId)
      .map(e => e.sourceId)

    const commonParents = personParents.filter(p => conjointParents.includes(p))

    if (commonParents.length > 0) {
      return {
        isValid: false,
        errorMessage: "Impossible d'ajouter un frère ou une sœur comme conjoint."
      }
    }
  }

  // 4. Vérifier la relation oncle/tante - neveu/nièce
  const isUncleAunt = edges.some(e => {
    if (e.type !== 'parent-child') return false
    
    // Vérifier si newConjoint est parent de personId ou vice-versa
    const personParents = edges
      .filter(ed => ed.type === 'parent-child' && ed.targetId === personId)
      .map(ed => ed.sourceId)

    const conjointParents = edges
      .filter(ed => ed.type === 'parent-child' && ed.targetId === newConjointId)
      .map(ed => ed.sourceId)

    // Vérifier si un parent de personId est frère/sœur du conjoint
    for (const parentId of personParents) {
      const parentParents = edges
        .filter(ed => ed.type === 'parent-child' && ed.targetId === parentId)
        .map(ed => ed.sourceId)

      if (parentParents.some(pp => conjointParents.includes(pp))) {
        return true
      }
    }

    return false
  })

  if (isUncleAunt) {
    return {
      isValid: false,
      errorMessage: "Impossible d'ajouter un oncle/tante ou neveu/nièce comme conjoint."
    }
  }

  return { isValid: true }
}

/**
 * Vérifier qu'on n'ajoute pas un doublon
 */
export function validateNoDuplicate(
  sourceId: string,
  targetId: string,
  edgeType: 'parent-child' | 'conjoint',
  edges: FamilyEdge[]
): ValidationResult {
  const exists = edges.some(
    e => e.type === edgeType &&
         ((e.sourceId === sourceId && e.targetId === targetId) ||
          (e.sourceId === targetId && e.targetId === sourceId))
  )

  if (exists) {
    return {
      isValid: false,
      errorMessage: "Cette relation existe déjà."
    }
  }

  return { isValid: true }
}