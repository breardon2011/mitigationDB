import React, { useState } from 'react'
import { classNames } from 'utils'
import { apiClient, ObservationInput, EvaluationResult } from 'utils/api'

interface Props {
  onError: (error: string) => void
}

const ObservationEvaluator: React.FC<Props> = ({ onError }) => {
  const [observation, setObservation] = useState<ObservationInput>({
    attic_vent_has_screens: 'True',
    roof_type: 'Class A',
    wildfire_risk_category: 'A',
    'Window Type': 'Double',
    vegetation: [{ Type: 'Tree', distance_to_window: 100 }]
  })

  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [asOfDate, setAsOfDate] = useState('')

  const handleInputChange = (field: keyof ObservationInput, value: any) => {
    if (field === 'vegetation') {
      setObservation((prev) => ({ ...prev, [field]: value }))
    } else {
      setObservation((prev) => ({ ...prev, [field]: value }))
    }
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
    value: any
  ) => {
    setObservation((prev) => ({
      ...prev,
      vegetation:
        prev.vegetation?.map((veg, i) =>
          i === index ? { ...veg, [field]: value } : veg
        ) || []
    }))
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Property Risk Evaluation
        </h2>
        <p className="mt-2 text-gray-600">
          Input property observations to identify wildfire vulnerabilities and
          mitigation strategies.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* As Of Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Evaluate As Of Date (optional)
            </label>
            <input
              type="datetime-local"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to use current rules
            </p>
          </div>

          {/* Basic Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Attic Vent Screens
              </label>
              <select
                value={observation.attic_vent_has_screens}
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
                value={observation.roof_type}
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
                value={observation.wildfire_risk_category}
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
                value={observation['Window Type']}
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
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
              >
                + Add Vegetation
              </button>
            </div>

            <div className="mt-2 space-y-3">
              {observation.vegetation?.map((veg, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md"
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

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={veg.distance_to_window}
                      onChange={(e) =>
                        updateVegetation(
                          index,
                          'distance_to_window',
                          parseInt(e.target.value)
                        )
                      }
                      className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Distance"
                    />
                    <span className="text-sm text-gray-600">ft</span>
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
            type="submit"
            disabled={loading}
            className={classNames(
              'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            )}
          >
            {loading ? 'Evaluating...' : 'Evaluate Property'}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Evaluation Results
          </h3>

          <div className="mb-4">
            <span
              className={classNames(
                'inline-flex px-3 py-1 rounded-full text-sm font-medium',
                result.matched === 0
                  ? 'bg-green-100 text-green-800'
                  : result.matched <= 2
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              )}
            >
              {result.matched} Vulnerabilities Found
            </span>
          </div>

          {result.vulnerabilities.length > 0 ? (
            <div className="space-y-6">
              {result.vulnerabilities.map((vulnerability, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900">
                      {vulnerability.name}
                    </h4>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {vulnerability.category}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">
                    {vulnerability.explanation}
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        🔧 Full Mitigations
                      </h5>
                      <ul className="space-y-1">
                        {vulnerability.mitigations.full.map(
                          (mitigation, mIndex) => (
                            <li
                              key={mIndex}
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
                      <h5 className="font-medium text-gray-900 mb-2">
                        🌉 Bridge Mitigations
                      </h5>
                      <ul className="space-y-1">
                        {vulnerability.mitigations.bridge.map(
                          (mitigation, mIndex) => (
                            <li
                              key={mIndex}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-green-500 text-4xl mb-2">✅</div>
              <h4 className="text-lg font-medium text-gray-900">
                No Vulnerabilities Found
              </h4>
              <p className="text-gray-600">
                This property meets all current wildfire safety requirements.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ObservationEvaluator
