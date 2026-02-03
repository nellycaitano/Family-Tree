export type Person = {
  id: string
  name: string
  firstNames: string
  gender: 'M' | 'F' | 'other'
  birthDate?: string 
}