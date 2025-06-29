export type UserRole = 'underwriter' | 'applied-science'

export interface AppState {
  currentView: 'evaluation' | 'rules' | 'testing'
  userRole: UserRole
  loading: boolean
  error: string | null
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'select' | 'boolean' | 'number' | 'array'
  options?: string[]
  required?: boolean
  placeholder?: string
}
