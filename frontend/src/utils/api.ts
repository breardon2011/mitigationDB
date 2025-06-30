// API configuration and utilities
const API_BASE_URL = 'http://localhost:8000' // Adjust to your backend URL

export interface ObservationInput {
  attic_vent_has_screens?: 'True' | 'False'
  roof_type?: 'Class A' | 'Class B' | 'Class C'
  wildfire_risk_category?: 'A' | 'B' | 'C' | 'D'
  'Window Type'?: 'Single' | 'Double' | 'Tempered Glass'
  vegetation?: Array<{
    Type: string
    distance_to_window: number
  }>
}

export interface Vulnerability {
  name: string
  category: string
  explanation: string
  mitigations: {
    full: string[]
    bridge: string[]
  }
}

export interface Rule {
  id?: number
  name: string
  category: string
  effective_date: string
  logic: Record<string, any>
  params: Record<string, any>
  explanation: string
  mitigations: {
    full: string[]
    bridge: string[]
  }
  retired_date?: string
}

export interface EvaluationResult {
  matched: number
  vulnerabilities: Vulnerability[]
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Evaluation endpoints
  async evaluateObservation(
    observation: ObservationInput,
    asOf?: string
  ): Promise<EvaluationResult> {
    const params = new URLSearchParams()
    if (asOf) params.append('as_of', asOf)

    return this.request<EvaluationResult>(`/api/v1/evaluate?${params}`, {
      method: 'POST',
      body: JSON.stringify(observation)
    })
  }

  // Rules management endpoints
  async getRules(asOf?: string): Promise<Rule[]> {
    const params = new URLSearchParams()
    if (asOf) params.append('as_of', asOf)

    return this.request<Rule[]>(`/api/v1/rules?${params}`)
  }

  async getRule(id: number): Promise<Rule> {
    return this.request<Rule>(`/api/v1/rules/${id}`)
  }

  async createRule(rule: Omit<Rule, 'id'>): Promise<Rule> {
    return this.request<Rule>('/api/v1/rules', {
      method: 'POST',
      body: JSON.stringify(rule)
    })
  }

  async updateRule(id: number, rule: Partial<Rule>): Promise<Rule> {
    return this.request<Rule>(`/api/v1/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule)
    })
  }

  async deleteRule(id: number): Promise<void> {
    await this.request(`/api/v1/rules/${id}`, {
      method: 'DELETE'
    })
  }

  async testRule(
    id: number,
    observation: ObservationInput
  ): Promise<{ hit: boolean; detail?: any }> {
    return this.request<{ hit: boolean; detail?: any }>(
      `/api/v1/rules/${id}/test`,
      {
        method: 'POST',
        body: JSON.stringify(observation)
      }
    )
  }
}

export const apiClient = new ApiClient()
