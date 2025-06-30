import React, { useState } from 'react'
import { classNames } from 'utils'
import { apiClient, EvaluationResult, Rule } from 'utils/api'
import StaticObservationForm from './StaticObservationForm'

interface Props {
  onError: (error: string) => void
}

const ObservationEvaluator: React.FC<Props> = ({ onError }) => {
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [activeRules, setActiveRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(false)
  const [asOfDate, setAsOfDate] = useState('')

  // ✅ User Story 1 & 4: Input observations and find vulnerabilities with time lock
  const handleEvaluateProperty = async (observation: any) => {
    setLoading(true)
    try {
      // Load rules for the specified time (or current time)
      const rules = await apiClient.getRules(asOfDate || undefined)
      setActiveRules(rules)

      // Evaluate against those rules
      const result = await apiClient.evaluateObservation(
        observation,
        asOfDate || undefined
      )
      setResult(result)
      onError('')
    } catch (error) {
      onError(
        error instanceof Error ? error.message : 'Failed to evaluate property'
      )
    } finally {
      setLoading(false)
    }
  }

  // ✅ User Story 5: Get rule explanation in human readable format
  const getRuleExplanation = (ruleName: string): string => {
    const rule = activeRules.find((r) => r.name === ruleName)
    return rule?.explanation || 'No explanation available'
  }

  // ✅ User Story 3: Get all mitigation options for a rule
  const getAllMitigationsForRule = (ruleName: string) => {
    const rule = activeRules.find((r) => r.name === ruleName)
    return rule?.mitigations || { full: [], bridge: [] }
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

      {/* ✅ User Story 4: Time Lock Feature */}
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
              <strong>Time Lock:</strong> Evaluate against rules as they existed
              at a specific date. This prevents "moving targets" for
              policyholders - once assessed, the requirements don't change.
            </p>
          </div>
          {activeRules.length > 0 && (
            <div className="text-sm text-blue-600">
              <div>📊 Active Rules: {activeRules.length}</div>
              <div>
                📅{' '}
                {asOfDate
                  ? `As of ${new Date(asOfDate).toLocaleDateString()}`
                  : 'Current Rules'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ User Story 1: Standard Observation Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Property Observation Form
          </h3>
          <p className="text-sm text-gray-500">
            Input property details to assess against wildfire safety
            requirements
            {asOfDate && ` as of ${new Date(asOfDate).toLocaleString()}`}
          </p>
        </div>

        <div className="p-6">
          <StaticObservationForm
            onSubmit={handleEvaluateProperty}
            loading={loading}
            submitLabel={`🔍 Assess Property${
              activeRules.length > 0
                ? ` Against ${activeRules.length} Rules`
                : ''
            }`}
          />
        </div>
      </div>

      {/* ✅ User Stories 1, 2, 3, 5: Vulnerability Assessment Results */}
      {result && (
        <div className="space-y-6">
          {/* Policy Assessment Summary */}
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

            {/* ✅ User Story 5: Human readable explanation for policy holders */}
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
              <h4 className="font-medium text-blue-900 mb-2">
                📞 For Policy Holder Explanation:
              </h4>
              <p className="text-sm text-blue-800">
                {result.matched === 0
                  ? 'Great news! Your property meets all current wildfire safety requirements and is ready for policy issuance.'
                  : result.matched <= 2
                    ? `Your property has ${result.matched} safety item${
                        result.matched > 1 ? 's' : ''
                      } that need${
                        result.matched === 1 ? 's' : ''
                      } attention before we can issue a policy. The good news is these are manageable improvements.`
                    : `Your property requires ${result.matched} safety improvements before we can provide coverage. While this might seem like a lot, each improvement significantly reduces your wildfire risk and helps protect your home.`}
                {asOfDate &&
                  ' These requirements are locked to the rules as they existed on ' +
                    new Date(asOfDate).toLocaleDateString() +
                    '.'}
              </p>
            </div>
          </div>

          {/* ✅ User Stories 2 & 3: Detailed Vulnerabilities with Mitigation Options */}
          {result.vulnerabilities.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                🔍 Detailed Vulnerability Assessment
              </h3>

              {result.vulnerabilities.map((vulnerability, index) => {
                const mitigations = getAllMitigationsForRule(vulnerability.name)

                return (
                  <div
                    key={index}
                    className="bg-white shadow rounded-lg p-6 border-l-4 border-red-400"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                          ⚠️ {vulnerability.name}
                        </h4>

                        {/* ✅ User Story 5: Human readable rule explanation */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                          <p className="text-sm text-yellow-800">
                            <strong>Why this matters:</strong>{' '}
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

                    {/* ✅ User Story 2 & 3: Mitigation Options */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-green-50 rounded-lg p-4">
                        <h5 className="font-medium text-green-900 mb-3 flex items-center">
                          🔧 Permanent Solutions
                          <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                            Recommended
                          </span>
                        </h5>
                        <ul className="space-y-2">
                          {mitigations.full.map((mitigation, mIndex) => (
                            <li
                              key={mIndex}
                              className="text-sm text-green-800 flex items-start"
                            >
                              <span className="text-green-600 mr-2 mt-1">
                                ✓
                              </span>
                              <span>{mitigation}</span>
                            </li>
                          ))}
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
                          {mitigations.bridge.map((mitigation, mIndex) => (
                            <li
                              key={mIndex}
                              className="text-sm text-blue-800 flex items-start"
                            >
                              <span className="text-blue-600 mr-2 mt-1">◉</span>
                              <span>{mitigation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* ✅ User Story 5: Technical details for explaining to policy holders */}
                    <details className="mt-4">
                      <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                        📖 View Technical Rule Details (for explaining specifics
                        to policy holders)
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono">
                        <pre className="whitespace-pre-wrap text-gray-700">
                          {JSON.stringify(
                            activeRules.find(
                              (r) => r.name === vulnerability.name
                            )?.logic,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </details>
                  </div>
                )
              })}
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
                {asOfDate &&
                  ` These requirements were evaluated using rules as of ${new Date(
                    asOfDate
                  ).toLocaleDateString()}.`}
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
