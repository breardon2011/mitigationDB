import React, { useState, useEffect } from 'react'
import { apiClient, Rule, EvaluationResult } from 'utils/api'
import { generateFormFields, FormField } from 'utils/dynamicFields'

const DynamicObservationForm: React.FC<{
  onError: (error: string) => void
}> = ({ onError }) => {
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [observation, setObservation] = useState<Record<string, any>>({})
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [asOfDate, setAsOfDate] = useState('')
  const [activeRules, setActiveRules] = useState<Rule[]>([])

  useEffect(() => {
    loadRulesAndGenerateForm()
  }, [asOfDate])

  const loadRulesAndGenerateForm = async () => {
    try {
      const rules = await apiClient.getRules(asOfDate || undefined)
      setActiveRules(rules)

      const fields = generateFormFields(rules)
      setFormFields(fields)

      const initialData: Record<string, any> = {}
      fields.forEach((field) => {
        initialData[field.name] = field.defaultValue
      })
      setObservation(initialData)
    } catch (error) {
      onError('Failed to load rules and generate form')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await apiClient.evaluateObservation(
        observation,
        asOfDate || undefined
      )
      setResult(result)
    } catch (error) {
      onError('Evaluation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setObservation((prev) => ({ ...prev, [fieldName]: value }))
  }

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'boolean':
        return (
          <select
            value={observation[field.name] || 'True'}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="True">Yes</option>
            <option value="False">No</option>
          </select>
        )

      case 'number':
        return (
          <input
            type="number"
            value={observation[field.name] || ''}
            onChange={(e) =>
              handleFieldChange(field.name, parseInt(e.target.value) || 0)
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        )

      case 'array':
        // Simple array handling for demo
        return (
          <textarea
            value={JSON.stringify(observation[field.name] || [])}
            onChange={(e) => {
              try {
                handleFieldChange(field.name, JSON.parse(e.target.value))
              } catch {}
            }}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm font-mono text-sm"
            placeholder='[{"Type": "Tree", "distance_to_window": 100}]'
          />
        )

      default:
        return (
          <input
            type="text"
            value={observation[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        )
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          🤖 Smart Dynamic Form
        </h2>
        <p className="mt-2 text-gray-600">
          Form automatically adapts to active rules • {formFields.length} fields
          detected
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-3">📅 Rule Time Machine</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-blue-700">
              Evaluate As Of Date (optional)
            </label>
            <input
              type="datetime-local"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="text-sm text-blue-600">
            <div>📊 Active Rules: {activeRules.length}</div>
            <div>📝 Form Fields: {formFields.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Generated Form Fields
          </h3>
          <p className="text-sm text-gray-500">
            Based on {activeRules.length} active rules
            {asOfDate && ` as of ${new Date(asOfDate).toLocaleString()}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formFields.map((field, index) => (
            <div key={field.name} className="relative">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                <span className="text-xs text-gray-400 ml-2">
                  ({field.type}) #{index + 1}
                </span>
              </label>
              {renderField(field)}

              <div className="mt-1 text-xs text-gray-500">
                Used by:{' '}
                {getRulesUsingField(field.name, activeRules).join(', ')}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading || formFields.length === 0}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading
              ? '⏳ Evaluating...'
              : `🔍 Evaluate Against ${activeRules.length} Rules`}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">✨ Smart Results</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">📊 Evaluation Summary</h4>
              <div className="bg-gray-50 p-4 rounded">
                <div>Matched Rules: {result.matched}</div>
                <div>Active Rules: {activeRules.length}</div>
                <div>
                  Success Rate:{' '}
                  {(
                    ((activeRules.length - result.matched) /
                      activeRules.length) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔍 Rule Analysis</h4>
              <div className="space-y-2 text-sm">
                {activeRules.map((rule) => (
                  <div
                    key={rule.name}
                    className={`p-2 rounded ${
                      result.vulnerabilities.some((v) => v.name === rule.name)
                        ? 'bg-red-50 text-red-700'
                        : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {result.vulnerabilities.some((v) => v.name === rule.name)
                      ? '❌'
                      : '✅'}{' '}
                    {rule.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getRulesUsingField(fieldName: string, rules: Rule[]): string[] {
  return rules
    .filter((rule) => JSON.stringify(rule.logic).includes(fieldName))
    .map((rule) => rule.name)
}

export default DynamicObservationForm
