import React, { useState } from 'react'
import { Rule } from 'utils/api'

interface Props {
  rule: Rule | null
  onSave: (rule: Omit<Rule, 'id'>) => void
  onCancel: () => void
  onError: (error: string) => void
}

const RuleEditor: React.FC<Props> = ({ rule, onSave, onCancel, onError }) => {
  const [formData, setFormData] = useState<Omit<Rule, 'id'>>({
    name: rule?.name || '',
    category: rule?.category || 'general',
    effective_date:
      rule?.effective_date || new Date().toISOString().split('T')[0],
    logic: rule?.logic || {},
    params: rule?.params || {},
    explanation: rule?.explanation || '',
    mitigations: rule?.mitigations || { full: [''], bridge: [''] },
    retired_date: rule?.retired_date || undefined
  })

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMitigationChange = (
    type: 'full' | 'bridge',
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      mitigations: {
        ...prev.mitigations,
        [type]: prev.mitigations[type].map((item, i) =>
          i === index ? value : item
        )
      }
    }))
  }

  const addMitigation = (type: 'full' | 'bridge') => {
    setFormData((prev) => ({
      ...prev,
      mitigations: {
        ...prev.mitigations,
        [type]: [...prev.mitigations[type], '']
      }
    }))
  }

  const removeMitigation = (type: 'full' | 'bridge', index: number) => {
    setFormData((prev) => ({
      ...prev,
      mitigations: {
        ...prev.mitigations,
        [type]: prev.mitigations[type].filter((_, i) => i !== index)
      }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.name.trim()) {
      onError('Rule name is required')
      return
    }

    if (!formData.explanation.trim()) {
      onError('Rule explanation is required')
      return
    }

    try {
      // Parse JSON fields if they're strings
      const processedData = {
        ...formData,
        logic:
          typeof formData.logic === 'string'
            ? JSON.parse(formData.logic)
            : formData.logic,
        params:
          typeof formData.params === 'string'
            ? JSON.parse(formData.params)
            : formData.params,
        mitigations: {
          full: formData.mitigations.full.filter((m) => m.trim()),
          bridge: formData.mitigations.bridge.filter((m) => m.trim())
        }
      }

      onSave(processedData)
    } catch (error) {
      onError('Invalid JSON in logic or params fields')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {rule ? 'Edit Rule' : 'Create New Rule'}
        </h2>

        <button
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="general">General</option>
                <option value="vents">Vents</option>
                <option value="roof">Roof</option>
                <option value="windows">Windows</option>
                <option value="vegetation">Vegetation</option>
                <option value="defensible-space">Defensible Space</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Effective Date *
              </label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={(e) =>
                  handleInputChange('effective_date', e.target.value)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Retired Date (optional)
              </label>
              <input
                type="date"
                value={formData.retired_date || ''}
                onChange={(e) =>
                  handleInputChange('retired_date', e.target.value || undefined)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Explanation *
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Explain what this rule evaluates and why it's important"
              required
            />
          </div>

          {/* Logic JSON */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Logic (JSON) *
            </label>
            <textarea
              value={
                typeof formData.logic === 'string'
                  ? formData.logic
                  : JSON.stringify(formData.logic, null, 2)
              }
              onChange={(e) => handleInputChange('logic', e.target.value)}
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              placeholder='{"and": [{"==": [{"var": "field_name"}, "value"]}]}'
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              JSON Logic expression that defines when this rule matches
            </p>
          </div>

          {/* Params JSON */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Parameters (JSON)
            </label>
            <textarea
              value={
                typeof formData.params === 'string'
                  ? formData.params
                  : JSON.stringify(formData.params, null, 2)
              }
              onChange={(e) => handleInputChange('params', e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              placeholder='{"param1": "value1", "param2": {"nested": "value"}}'
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional parameters used in the logic expression
            </p>
          </div>

          {/* Mitigations */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Full Mitigations */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Full Mitigations
                </label>
                <button
                  type="button"
                  onClick={() => addMitigation('full')}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-2">
                {formData.mitigations.full.map((mitigation, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <textarea
                      value={mitigation}
                      onChange={(e) =>
                        handleMitigationChange('full', index, e.target.value)
                      }
                      rows={2}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      placeholder="Describe the full mitigation..."
                    />
                    {formData.mitigations.full.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMitigation('full', index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bridge Mitigations */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Bridge Mitigations
                </label>
                <button
                  type="button"
                  onClick={() => addMitigation('bridge')}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-2">
                {formData.mitigations.bridge.map((mitigation, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <textarea
                      value={mitigation}
                      onChange={(e) =>
                        handleMitigationChange('bridge', index, e.target.value)
                      }
                      rows={2}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      placeholder="Describe the bridge mitigation..."
                    />
                    {formData.mitigations.bridge.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMitigation('bridge', index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {rule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RuleEditor
