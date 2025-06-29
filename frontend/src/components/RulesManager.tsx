import React, { useState, useEffect } from 'react'
import { classNames } from 'utils'
import { apiClient, Rule } from 'utils/api'
import RuleEditor from './RuleEditor'

interface Props {
  onError: (error: string) => void
}

const RulesManager: React.FC<Props> = ({ onError }) => {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [asOfDate, setAsOfDate] = useState('')

  useEffect(() => {
    loadRules()
  }, [asOfDate])

  const loadRules = async () => {
    setLoading(true)
    try {
      const rulesData = await apiClient.getRules(asOfDate || undefined)
      setRules(rulesData)
      onError('')
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load rules')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = () => {
    setIsCreating(true)
    setEditingRule(null)
  }

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule)
    setIsCreating(false)
  }

  const handleDeleteRule = async (rule: Rule) => {
    if (!rule.id) return

    if (window.confirm(`Are you sure you want to delete "${rule.name}"?`)) {
      try {
        await apiClient.deleteRule(rule.id)
        await loadRules()
        onError('')
      } catch (error) {
        onError(
          error instanceof Error ? error.message : 'Failed to delete rule'
        )
      }
    }
  }

  const handleSaveRule = async (ruleData: Omit<Rule, 'id'>) => {
    try {
      if (editingRule?.id) {
        await apiClient.updateRule(editingRule.id, ruleData)
      } else {
        await apiClient.createRule(ruleData)
      }

      setEditingRule(null)
      setIsCreating(false)
      await loadRules()
      onError('')
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save rule')
    }
  }

  const handleCancel = () => {
    setEditingRule(null)
    setIsCreating(false)
  }

  if (isCreating || editingRule) {
    return (
      <RuleEditor
        rule={editingRule}
        onSave={handleSaveRule}
        onCancel={handleCancel}
        onError={onError}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rules Management</h2>
          <p className="mt-2 text-gray-600">
            Create, edit, and manage wildfire assessment rules.
          </p>
        </div>

        <button
          onClick={handleCreateRule}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          + Create New Rule
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              View Rules As Of
            </label>
            <input
              type="datetime-local"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setAsOfDate('')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              No rules found
            </h3>
            <p className="mt-2 text-gray-600">
              Create your first rule to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <div key={rule.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {rule.name}
                      </h3>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {rule.category}
                      </span>
                      {rule.retired_date && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Retired
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-gray-600">{rule.explanation}</p>

                    <div className="mt-3 text-sm text-gray-500">
                      <span>
                        Effective:{' '}
                        {new Date(rule.effective_date).toLocaleDateString()}
                      </span>
                      {rule.retired_date && (
                        <span className="ml-4">
                          Retired:{' '}
                          {new Date(rule.retired_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteRule(rule)}
                      className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Rule Preview */}
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Mitigations:
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <strong>Full:</strong>
                      <ul className="mt-1 space-y-1">
                        {rule.mitigations.full.map((m, i) => (
                          <li key={i} className="text-gray-600">
                            • {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Bridge:</strong>
                      <ul className="mt-1 space-y-1">
                        {rule.mitigations.bridge.map((m, i) => (
                          <li key={i} className="text-gray-600">
                            • {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RulesManager
