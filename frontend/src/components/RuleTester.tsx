import React, { useState, useEffect } from 'react'
import { classNames } from 'utils'
import { apiClient, Rule, ObservationInput } from 'utils/api'

interface Props {
  onError: (error: string) => void
}

const RuleTester: React.FC<Props> = ({ onError }) => {
  const [rules, setRules] = useState<Rule[]>([])
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [observation, setObservation] = useState<ObservationInput>({
    attic_vent_has_screens: 'True',
    roof_type: 'Class A',
    wildfire_risk_category: 'A',
    'Window Type': 'Double',
    vegetation: [{ Type: 'Tree', distance_to_window: 100 }]
  })
  const [testResult, setTestResult] = useState<{
    hit: boolean
    detail?: any
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const rulesData = await apiClient.getRules()
      setRules(rulesData)
      onError('')
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load rules')
    }
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

  const handleInputChange = (field: keyof ObservationInput, value: string) => {
    if (field === 'vegetation') {
      return
    }
    setObservation((prev) => ({ ...prev, [field]: value }))
  }

  const addVegetation = () => {
    const newVeg = { Type: 'Tree', distance_to_window: 50 }
    setObservation((prev) => ({
      ...prev,
      vegetation: [...(prev.vegetation || []), newVeg]
    }))
  }

  const removeVegetation = (index: number) => {
    setObservation((prev) => ({
      ...prev,
      vegetation: prev.vegetation?.filter((_, i) => i !== index) || []
    }))
  }

  const updateVegetation = (
    index: number,
    field: 'Type' | 'distance_to_window',
    value: string | number
  ) => {
    setObservation((prev) => ({
      ...prev,
      vegetation:
        prev.vegetation?.map((veg, i) =>
          i === index ? { ...veg, [field]: value } : veg
        ) || []
    }))
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Rule Testing</h2>
        <p className="mt-2 text-gray-600">
          Test individual rules against sample observations to validate they
          work correctly.
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
                  className={classNames(
                    'p-4 rounded-lg border-2 cursor-pointer transition-colors',
                    selectedRule?.id === rule.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => setSelectedRule(rule)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {rule.explanation}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {rule.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          Effective:{' '}
                          {new Date(rule.effective_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {selectedRule?.id === rule.id && (
                      <div className="text-indigo-600 text-xl">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Input */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Test Observation
          </h3>

          <div className="space-y-4">
            {/* Basic Properties */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Attic Vent Screens
              </label>
              <select
                value={observation.attic_vent_has_screens || 'True'}
                onChange={(e) =>
                  handleInputChange('attic_vent_has_screens', e.target.value)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="True">Yes - Has Screens</option>
                <option value="False">No - No Screens</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Roof Type
              </label>
              <select
                value={observation.roof_type || 'Class A'}
                onChange={(e) => handleInputChange('roof_type', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="Class A">Class A</option>
                <option value="Class B">Class B</option>
                <option value="Class C">Class C</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Wildfire Risk Category
              </label>
              <select
                value={observation.wildfire_risk_category || 'A'}
                onChange={(e) =>
                  handleInputChange('wildfire_risk_category', e.target.value)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="A">Category A (Low)</option>
                <option value="B">Category B (Moderate)</option>
                <option value="C">Category C (High)</option>
                <option value="D">Category D (Extreme)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Window Type
              </label>
              <select
                value={observation['Window Type'] || 'Double'}
                onChange={(e) =>
                  handleInputChange('Window Type', e.target.value)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="Single">Single Pane</option>
                <option value="Double">Double Pane</option>
                <option value="Tempered Glass">Tempered Glass</option>
              </select>
            </div>

            {/* Vegetation */}
            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Vegetation Near Windows
                </label>
                <button
                  type="button"
                  onClick={addVegetation}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {observation.vegetation?.map((veg, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md"
                  >
                    <select
                      value={veg.Type}
                      onChange={(e) =>
                        updateVegetation(index, 'Type', e.target.value)
                      }
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="Tree">Tree</option>
                      <option value="Shrub">Shrub</option>
                      <option value="Grass">Grass</option>
                    </select>

                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        value={veg.distance_to_window || ''}
                        onChange={(e) =>
                          updateVegetation(
                            index,
                            'distance_to_window',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-600">ft</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeVegetation(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleTestRule}
              disabled={loading || !selectedRule}
              className={classNames(
                'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
                loading || !selectedRule
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              )}
            >
              {loading ? 'Testing...' : 'Test Rule'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResult && selectedRule && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Test Results
          </h3>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div
                className={classNames(
                  'text-2xl',
                  testResult.hit ? 'text-red-500' : 'text-green-500'
                )}
              >
                {testResult.hit ? '⚠️' : '✅'}
              </div>
              <div>
                <p className="font-medium">
                  Rule {testResult.hit ? 'MATCHED' : 'DID NOT MATCH'}
                </p>
                <p className="text-sm text-gray-600">
                  {testResult.hit
                    ? `The rule "${selectedRule.name}" was triggered by this observation`
                    : `The rule "${selectedRule.name}" was not triggered by this observation`}
                </p>
              </div>
            </div>

            {/* Rule Details */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Rule Details</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Logic:</strong>
                </p>
                <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                  {JSON.stringify(selectedRule.logic, null, 2)}
                </pre>
              </div>
            </div>

            {/* Test Details */}
            {testResult.detail && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Test Details</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                    {JSON.stringify(testResult.detail, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* If rule matched, show mitigations */}
            {testResult.hit && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Available Mitigations
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">
                      🔧 Full Mitigations
                    </h5>
                    <ul className="space-y-1">
                      {selectedRule.mitigations.full.map(
                        (mitigation, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-start"
                          >
                            <span className="text-green-500 mr-2">•</span>
                            {mitigation}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">
                      🌉 Bridge Mitigations
                    </h5>
                    <ul className="space-y-1">
                      {selectedRule.mitigations.bridge.map(
                        (mitigation, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-start"
                          >
                            <span className="text-blue-500 mr-2">•</span>
                            {mitigation}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RuleTester
