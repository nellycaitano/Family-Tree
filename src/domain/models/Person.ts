export type Person = {
  id: string
  name: string
  firstNames: string
  gender: 'M' | 'F' | 'other'
  birthDate?: string 
}

export type EdgeType = 'parent-child' | 'conjoint' | 'sibling'

export type FamilyEdge = {
  id: string
  sourceId: string
  targetId: string
  type: EdgeType
}

export type Relation = {
  personId: string
  relationType: 'parent' | 'child' | 'sibling' | 'conjoint' | 'uncle-aunt' | 'nephew-niece' | 'cousin' | 'grandparent' | 'grandchild'
  person: Person
}