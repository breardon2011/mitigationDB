import React, { useState, useEffect } from 'react'
import { classNames } from 'utils'
import { apiClient, ObservationInput, EvaluationResult, Rule } from 'utils/api'
import { generateFormFields, FormField } from 'utils/dynamicFields'

interface Props {
  onError: (error: string) => void
}

const ObservationEvaluator: React.FC<Props> = ({ onError }) => {
  const [activeRules, setActiveRules] = useState<Rule[]>([])
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [observation, setObservation] = useState<Record<string, any>>({})
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [asOfDate, setAsOfDate] = useState('')

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

      onError('')
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
      onError('')
    } catch (error) {
      onError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setObservation((prev) => ({ ...prev, [fieldName]: value }))
  }

  const addArrayItem = (fieldName: string) => {
    const field = formFields.find((f) => f.name === fieldName)
    const defaultItem = field?.defaultValue?.[0] || {}
    const newItem =
      Object.keys(defaultItem).length > 0 ? { ...defaultItem } : { value: '' }

    setObservation((prev) => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), newItem]
    }))
  }

  const removeArrayItem = (fieldName: string, index: number) => {
    setObservation((prev) => ({
      ...prev,
      [fieldName]:
        (prev[fieldName] as any[])?.filter((_, i) => i !== index) || []
    }))
  }

  const updateArrayItem = (
    fieldName: string,
    index: number,
    itemField: string,
    value: any
  ) => {
    setObservation((prev) => ({
      ...prev,
      [fieldName]:
        (prev[fieldName] as any[])?.map((item: any, i) =>
          i === index ? { ...item, [itemField]: value } : item
        ) || []
    }))
  }

  const getArrayItemStructure = (fieldName: string): any[] => {
    const field = formFields.find((f) => f.name === fieldName)
    const sampleItem = field?.defaultValue?.[0]

    if (!sampleItem || typeof sampleItem !== 'object') {
      return [{ key: 'value', type: 'text' }]
    }

    return Object.keys(sampleItem).map((key): any => {
      const value = sampleItem[key]
      let type = 'text'
      let options: any = undefined

      if (typeof value === 'number') {
        type = 'number'
      } else if (key.toLowerCase().includes('type')) {
        type = 'select'
        options = extractArrayFieldOptions(fieldName, key)
      }

      return { key, type, options }
    })
  }

  const extractArrayFieldOptions = (
    arrayFieldName: string,
    itemKey: string
  ): string[] => {
    const options = new Set<string>()

    activeRules.forEach((rule) => {
      if (rule.params) {
        Object.keys(rule.params).forEach((paramKey) => {
          const paramValue = rule.params[paramKey]

          if (typeof paramValue === 'object' && !Array.isArray(paramValue)) {
            if (
              itemKey.toLowerCase().includes('type') &&
              paramKey.toLowerCase().includes('veg')
            ) {
              Object.keys(paramValue).forEach((option) => options.add(option))
            }

            if (
              itemKey.toLowerCase().includes('window') &&
              paramKey.toLowerCase().includes('window')
            ) {
              Object.keys(paramValue).forEach((option) => options.add(option))
            }

            if (paramKey.toLowerCase().includes(itemKey.toLowerCase())) {
              Object.keys(paramValue).forEach((option) => options.add(option))
            }
          }
        })
      }

      const logicStr = JSON.stringify(rule.logic)

      function findArrayOptions(obj: any) {
        if (typeof obj !== 'object' || obj === null) return

        if (obj.in && Array.isArray(obj.in) && obj.in.length === 2) {
          const [varObj, optionsArray] = obj.in

          if (varObj?.var && Array.isArray(varObj.var)) {
            const varPath = varObj.var[0]
            if (
              varPath &&
              varPath.startsWith(`${arrayFieldName}.`) &&
              varPath.includes(itemKey) &&
              Array.isArray(optionsArray)
            ) {
              optionsArray.forEach((option: any) => options.add(option))
            }
          }
        }

        Object.values(obj).forEach(findArrayOptions)
      }

      findArrayOptions(rule.logic)
    })

    return Array.from(options)
  }

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'select':
        return (
          <select
            value={observation[field.name] || field.defaultValue || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {field.options?.map((option: any) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'boolean':
        return (
          <select
            value={observation[field.name] || field.defaultValue || 'True'}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        )

      case 'array':
        const arrayItems = (observation[field.name] as any[]) || []
        const itemStructure = getArrayItemStructure(field.name)

        return (
          <div className="space-y-2">
            {arrayItems.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md border"
              >
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {itemStructure.map((fieldItem: any) => {
                    const { key, type, options } = fieldItem
                    return (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {key.replace(/_/g, ' ')}
                        </label>
                        {type === 'select' && options ? (
                          <select
                            value={item[key] || ''}
                            onChange={(e) =>
                              updateArrayItem(
                                field.name,
                                index,
                                key,
                                e.target.value
                              )
                            }
                            className="w-full text-sm rounded border-gray-300"
                          >
                            {options.map((option: any) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : type === 'number' ? (
                          <input
                            type="number"
                            value={item[key] || ''}
                            onChange={(e) =>
                              updateArrayItem(
                                field.name,
                                index,
                                key,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full text-sm rounded border-gray-300"
                          />
                        ) : (
                          <input
                            type="text"
                            value={item[key] || ''}
                            onChange={(e) =>
                              updateArrayItem(
                                field.name,
                                index,
                                key,
                                e.target.value
                              )
                            }
                            className="w-full text-sm rounded border-gray-300"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => removeArrayItem(field.name, index)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addArrayItem(field.name)}
              className="w-full text-sm text-indigo-600 hover:text-indigo-800 py-2 border border-dashed border-indigo-300 rounded-md"
            >
              + Add {field.label} Item
            </button>
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={observation[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        )
    }
  }

  const getRuleExplanation = (ruleName: string): string => {
    const rule = activeRules.find((r) => r.name === ruleName)
    return rule?.explanation || 'No explanation available'
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          🏠 Property Risk Assessment
        </h2>
        <p className="mt-2 text-gray-600">
          Input property observations to identify vulnerabilities and determine
          policy requirements.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-3">📅 Policy Time Lock</h3>
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
            <p className="mt-1 text-xs text-blue-600">
              Lock evaluation to specific rules version - prevents "moving
              target" for policyholders
            </p>
          </div>

          <div className="text-sm text-blue-600">
            <div>📊 Active Rules: {activeRules.length}</div>
            <div>📝 Form Fields: {formFields.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Property Observation Form
          </h3>
          <p className="text-sm text-gray-500">
            Form automatically generated from {activeRules.length} active rules
            {asOfDate && ` as of ${new Date(asOfDate).toLocaleString()}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {formFields.map((field, index) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                <span className="text-xs text-gray-400 ml-2">
                  ({field.type}) #{index + 1}
                </span>
              </label>
              {renderField(field)}

              <div className="mt-1 text-xs text-gray-500">
                Used by:{' '}
                {activeRules
                  .filter((rule) =>
                    JSON.stringify(rule.logic).includes(field.name)
                  )
                  .map((rule) => rule.name)
                  .join(', ')}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading || formFields.length === 0}
            className={classNames(
              'w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
              loading || formFields.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            )}
          >
            {loading
              ? '⏳ Evaluating...'
              : `🔍 Assess Property Against ${activeRules.length} Rules`}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              📋 Policy Assessment Summary
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {result.matched}
                </div>
                <div className="text-sm text-gray-600">
                  Vulnerabilities Found
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {activeRules.length - result.matched}
                </div>
                <div className="text-sm text-gray-600">Requirements Met</div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div
                  className={classNames(
                    'text-2xl font-bold',
                    result.matched === 0
                      ? 'text-green-600'
                      : result.matched <= 2
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  )}
                >
                  {result.matched === 0
                    ? 'READY'
                    : result.matched <= 2
                      ? 'CONDITIONAL'
                      : 'REQUIRES WORK'}
                </div>
                <div className="text-sm text-gray-600">Policy Status</div>
              </div>
            </div>
          </div>

          {result.vulnerabilities.length > 0 ? (
            <div className="space-y-4">
              {result.vulnerabilities.map((vulnerability, index) => (
                <div
                  key={index}
                  className="bg-white shadow rounded-lg p-6 border-l-4 border-red-400"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        ⚠️ {vulnerability.name}
                      </h4>

                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Rule Explanation:</strong>{' '}
                          {getRuleExplanation(vulnerability.name)}
                        </p>
                      </div>

                      <p className="text-gray-700 mb-4">
                        {vulnerability.explanation}
                      </p>
                    </div>

                    <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 ml-4">
                      {vulnerability.category}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-medium text-green-900 mb-3 flex items-center">
                        🔧 Permanent Solutions
                        <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                          Recommended
                        </span>
                      </h5>
                      <ul className="space-y-2">
                        {vulnerability.mitigations.full.map(
                          (mitigation, mIndex) => (
                            <li
                              key={mIndex}
                              className="text-sm text-green-800 flex items-start"
                            >
                              <span className="text-green-600 mr-2 mt-1">
                                ✓
                              </span>
                              <span>{mitigation}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-3 flex items-center">
                        🌉 Temporary Measures
                        <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                          Interim
                        </span>
                      </h5>
                      <ul className="space-y-2">
                        {vulnerability.mitigations.bridge.map(
                          (mitigation, mIndex) => (
                            <li
                              key={mIndex}
                              className="text-sm text-blue-800 flex items-start"
                            >
                              <span className="text-blue-600 mr-2 mt-1">◉</span>
                              <span>{mitigation}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>

                  <details className="mt-4">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      📖 View Technical Rule Details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono">
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {JSON.stringify(
                          activeRules.find((r) => r.name === vulnerability.name)
                            ?.logic,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center border-l-4 border-green-400">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <h4 className="text-xl font-medium text-gray-900 mb-2">
                Property Approved for Coverage
              </h4>
              <p className="text-gray-600 mb-4">
                This property meets all current wildfire safety requirements and
                is ready for policy issuance.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <span className="mr-2">🎉</span>
                All {activeRules.length} safety rules satisfied
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ObservationEvaluator
