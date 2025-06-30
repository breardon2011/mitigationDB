import React, { useState, useEffect } from 'react'
import { classNames } from 'utils'
import { apiClient, Rule } from 'utils/api'
import StaticObservationForm from './StaticObservationForm'

interface Props {
  onError: (error: string) => void
}

const RuleTester: React.FC<Props> = ({ onError }) => {
  const [rules, setRules] = useState<Rule[]>([])
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
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

  const handleTestRule = async (observation: any) => {
    if (!selectedRule?.id) {
      onError('Please select a rule to test')
      return
    }

    console.log('🐛 Testing rule:', selectedRule.name)
    console.log('🐛 Observation being sent:', observation)

    setLoading(true)
    try {
      const result = await apiClient.testRule(selectedRule.id, observation)
      setTestResult(result)
      onError('')
    } catch (error) {
      console.error('🐛 Test rule error:', error)
      onError(error instanceof Error ? error.message : 'Failed to test rule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🧪 Rule Testing</h2>
        <p className="mt-2 text-gray-600">
          Test individual rules with a standardized observation form.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Rule Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Select Rule to Test
          </h3>

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
                <h4 className="font-medium text-gray-900 mb-1">
                  {rule.name}
                  {selectedRule?.id === rule.id && (
                    <span className="ml-2 text-blue-600">✓</span>
                  )}
                </h4>
                <p className="text-sm text-gray-600 mb-2">{rule.explanation}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {rule.category}
                  </span>
                  <span>Effective: {rule.effective_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Static Test Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            📋 Standard Observation Form
          </h3>

          {!selectedRule ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a rule to test</p>
            </div>
          ) : (
            <StaticObservationForm
              onSubmit={handleTestRule}
              loading={loading}
              submitLabel={`🧪 Test "${selectedRule.name}"`}
            />
          )}
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            📊 Test Results
          </h3>
          <div
            className={classNames(
              'p-4 rounded-lg border-l-4',
              testResult.hit
                ? 'border-red-400 bg-red-50'
                : 'border-green-400 bg-green-50'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {testResult.hit ? '⚠️ Rule Triggered' : '✅ Rule Passed'}
              </span>
              <span className="text-sm text-gray-600">
                Rule: {selectedRule?.name}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RuleTester
