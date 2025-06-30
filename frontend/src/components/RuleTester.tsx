import React, { useState, useEffect } from 'react'
import { classNames } from 'utils'
import { apiClient, Rule, EvaluationResult } from 'utils/api'
import { generateFormFields, FormField } from 'utils/dynamicFields'

interface Props {
  onError: (error: string) => void
}

const RuleTester: React.FC<Props> = ({ onError }) => {
  const [rules, setRules] = useState<Rule[]>([])
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [observation, setObservation] = useState<Record<string, any>>({})
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRules()
  }, [])

  // ✅ When rule is selected, generate form fields specifically for that rule
  useEffect(() => {
    if (selectedRule) {
      generateFormForSelectedRule()
    }
  }, [selectedRule])

  const loadRules = async () => {
    try {
      const rulesData = await apiClient.getRules()
      setRules(rulesData)
      onError('')
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load rules')
    }
  }

  // ✅ Generate form fields specifically for the selected rule
  const generateFormForSelectedRule = () => {
    if (!selectedRule) return

    // Generate fields for just this one rule
    const fields = generateFormFields([selectedRule])
    setFormFields(fields)

    // Initialize observation with default values
    const initialData: Record<string, any> = {}
    fields.forEach((field) => {
      initialData[field.name] = field.defaultValue
    })
    setObservation(initialData)
    setTestResult(null) // Clear previous results
  }

  const handleTestRule = async () => {
    if (!selectedRule?.id) {
      onError('Please select a rule to test')
      return
    }

    setLoading(true)
    try {
      const result = await apiClient.testRule(selectedRule.id, observation)
      setTestResult(result)
      onError('')
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to test rule')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setObservation((prev) => ({ ...prev, [fieldName]: value }))
  }

  // ✅ Same array handling as ObservationEvaluator
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

  // ✅ Same array structure detection as ObservationEvaluator
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
        // ✅ Extract options from the selected rule's parameters
        options = extractArrayFieldOptions(fieldName, key)
      }

      return { key, type, options }
    })
  }

  // ✅ Extract options from selected rule's parameters
  const extractArrayFieldOptions = (
    arrayFieldName: string,
    itemKey: string
  ): string[] => {
    if (!selectedRule) return []

    const options = new Set<string>()

    // Look in selected rule's parameters
    if (selectedRule.params) {
      Object.keys(selectedRule.params).forEach((paramKey) => {
        const paramValue = selectedRule.params[paramKey]

        if (typeof paramValue === 'object' && !Array.isArray(paramValue)) {
          // For vegetation Type field, look for veg_div, vegetation_types, etc.
          if (
            itemKey.toLowerCase().includes('type') &&
            paramKey.toLowerCase().includes('veg')
          ) {
            Object.keys(paramValue).forEach((option) => options.add(option))
          }

          // For window Type field, look for window_mult, window_types, etc.
          if (
            itemKey.toLowerCase().includes('window') &&
            paramKey.toLowerCase().includes('window')
          ) {
            Object.keys(paramValue).forEach((option) => options.add(option))
          }

          // Generic: if the item key matches part of the param key
          if (paramKey.toLowerCase().includes(itemKey.toLowerCase())) {
            Object.keys(paramValue).forEach((option) => options.add(option))
          }
        }
      })
    }

    return Array.from(options)
  }

  // ✅ Same field rendering as ObservationEvaluator
  const renderFormField = (field: FormField) => {
    switch (field.type) {
      case 'select':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <select
              value={observation[field.name] || field.defaultValue || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option: any) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )

      case 'boolean':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <select
              value={observation[field.name] || field.defaultValue || 'True'}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="True">Yes</option>
              <option value="False">No</option>
            </select>
          </div>
        )

      case 'number':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="number"
              value={observation[field.name] || ''}
              onChange={(e) =>
                handleFieldChange(field.name, parseInt(e.target.value) || 0)
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        )

      case 'array':
        const arrayItems = (observation[field.name] as any[]) || []
        const itemStructure = getArrayItemStructure(field.name)

        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
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
                className="w-full text-sm text-blue-600 hover:text-blue-800 py-2 border border-dashed border-blue-300 rounded-md"
              >
                + Add {field.label} Item
              </button>
            </div>
          </div>
        )

      default:
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              value={observation[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        )
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          🧪 Smart Rule Testing
        </h2>
        <p className="mt-2 text-gray-600">
          Test individual rules with dynamically generated forms that adapt to
          each rule's requirements.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Rule Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Select Rule to Test
          </h3>

          {rules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No rules available for testing</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  onClick={() => setSelectedRule(rule)}
                  className={classNames(
                    'p-4 border rounded-lg cursor-pointer transition-all',
                    selectedRule?.id === rule.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {rule.name}
                        {selectedRule?.id === rule.id && (
                          <span className="ml-2 text-blue-600">✓</span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {rule.explanation}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {rule.category}
                        </span>
                        <span>Effective: {rule.effective_date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Test Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              🧮 Dynamic Test Form
            </h3>
            <span className="text-sm text-gray-500">
              {formFields.length} fields detected
            </span>
          </div>

          {!selectedRule ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Select a rule to generate test form
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formFields.map((field) => renderFormField(field))}

              <button
                onClick={handleTestRule}
                disabled={loading || formFields.length === 0}
                className={classNames(
                  'w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
                  loading || formFields.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                )}
              >
                {loading ? '⏳ Testing...' : `🧪 Test "${selectedRule.name}"`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            📊 Test Results
          </h3>
          <div className="space-y-4">
            <div
              className={classNames(
                'p-4 rounded-lg border-l-4',
                testResult.matched
                  ? 'border-red-400 bg-red-50'
                  : 'border-green-400 bg-green-50'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {testResult.matched ? '⚠️ Rule Triggered' : '✅ Rule Passed'}
                </span>
                <span className="text-sm text-gray-600">
                  Rule: {selectedRule?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RuleTester
