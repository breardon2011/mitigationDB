import React, { useState } from 'react'
import { classNames } from 'utils'

// ✅ Interface matching actual API field names
interface ObservationInput {
  attic_vent_has_screens: 'True' | 'False'
  roof_type: 'Class A' | 'Class B' | 'Class C'
  'Window Type': 'Single' | 'Double' | 'Tempered Glass'
  wildfire_risk_category: 'A' | 'B' | 'C' | 'D'
  vegetation: VegetationEntry[]
}

interface VegetationEntry {
  Type: string
  distance_to_window: number
}

interface Props {
  onSubmit: (observation: ObservationInput) => void
  loading?: boolean
  submitLabel?: string
}

const StaticObservationForm: React.FC<Props> = ({
  onSubmit,
  loading = false,
  submitLabel = 'Submit'
}) => {
  const [observation, setObservation] = useState<ObservationInput>({
    attic_vent_has_screens: 'True',
    roof_type: 'Class A',
    'Window Type': 'Double',
    wildfire_risk_category: 'A',
    vegetation: [{ Type: 'Tree', distance_to_window: 100 }]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🐛 Submitting observation:', observation)
    onSubmit(observation)
  }

  const updateField = <K extends keyof ObservationInput>(
    field: K,
    value: ObservationInput[K]
  ) => {
    setObservation((prev) => ({ ...prev, [field]: value }))
  }

  const addVegetationItem = () => {
    setObservation((prev) => ({
      ...prev,
      vegetation: [
        ...prev.vegetation,
        { Type: 'Tree', distance_to_window: 100 }
      ]
    }))
  }

  const removeVegetationItem = (index: number) => {
    setObservation((prev) => ({
      ...prev,
      vegetation: prev.vegetation.filter((_, i) => i !== index)
    }))
  }

  const updateVegetationItem = (
    index: number,
    field: keyof VegetationEntry,
    value: any
  ) => {
    setObservation((prev) => ({
      ...prev,
      vegetation: prev.vegetation.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Attic Vent has Screens */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attic Vent has Screens
        </label>
        <select
          value={observation.attic_vent_has_screens}
          onChange={(e) =>
            updateField(
              'attic_vent_has_screens',
              e.target.value as 'True' | 'False'
            )
          }
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="True">Yes</option>
          <option value="False">No</option>
        </select>
      </div>

      {/* Roof Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Roof Type
        </label>
        <select
          value={observation.roof_type}
          onChange={(e) => updateField('roof_type', e.target.value as any)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="Class A">Class A</option>
          <option value="Class B">Class B</option>
          <option value="Class C">Class C</option>
        </select>
      </div>

      {/* Window Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Window Type
        </label>
        <select
          value={observation['Window Type']}
          onChange={(e) => updateField('Window Type', e.target.value as any)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="Single">Single</option>
          <option value="Double">Double</option>
          <option value="Tempered Glass">Tempered Glass</option>
        </select>
      </div>

      {/* Wildfire Risk Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Wildfire Risk Category
        </label>
        <select
          value={observation.wildfire_risk_category}
          onChange={(e) =>
            updateField('wildfire_risk_category', e.target.value as any)
          }
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>

      {/* Vegetation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vegetation
        </label>
        <div className="space-y-2">
          {observation.vegetation.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md border"
            >
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Type
                  </label>
                  <select
                    value={item.Type}
                    onChange={(e) =>
                      updateVegetationItem(index, 'Type', e.target.value)
                    }
                    className="w-full text-sm rounded border-gray-300"
                  >
                    <option value="Tree">Tree</option>
                    <option value="Shrub">Shrub</option>
                    <option value="Grass">Grass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Distance to Window (ft)
                  </label>
                  <input
                    type="number"
                    value={item.distance_to_window}
                    onChange={(e) =>
                      updateVegetationItem(
                        index,
                        'distance_to_window',
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full text-sm rounded border-gray-300"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeVegetationItem(index)}
                className="text-red-600 hover:text-red-800 p-1"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addVegetationItem}
            className="w-full text-sm text-blue-600 hover:text-blue-800 py-2 border border-dashed border-blue-300 rounded-md"
          >
            + Add Vegetation Item
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={classNames(
          'w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        )}
      >
        {loading ? '⏳ Testing...' : submitLabel}
      </button>
    </form>
  )
}

export default StaticObservationForm
