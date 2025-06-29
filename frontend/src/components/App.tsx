import React, { useState } from 'react'
import { classNames } from 'utils'
import { UserRole, AppState } from './types'
import ObservationEvaluator from './ObservationEvaluator'
import RulesManager from './RulesManager'
import RuleTester from './RuleTester'

interface NavigationItem {
  id: 'evaluation' | 'rules' | 'testing'
  name: string
  icon: string
  roles: UserRole[]
}

const navigation: NavigationItem[] = [
  {
    id: 'evaluation',
    name: 'Property Evaluation',
    icon: '🏠',
    roles: ['underwriter']
  },
  {
    id: 'rules',
    name: 'Rules Management',
    icon: '⚙️',
    roles: ['applied-science']
  },
  {
    id: 'testing',
    name: 'Rule Testing',
    icon: '🧪',
    roles: ['applied-science']
  }
]

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentView: 'evaluation',
    userRole: 'underwriter',
    loading: false,
    error: null
  })

  const updateAppState = (updates: Partial<AppState>) => {
    setAppState((prev) => ({ ...prev, ...updates }))
  }

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(appState.userRole)
  )

  const renderCurrentView = () => {
    switch (appState.currentView) {
      case 'evaluation':
        return (
          <ObservationEvaluator
            onError={(error) => updateAppState({ error })}
          />
        )
      case 'rules':
        return <RulesManager onError={(error) => updateAppState({ error })} />
      case 'testing':
        return <RuleTester onError={(error) => updateAppState({ error })} />
      default:
        return (
          <ObservationEvaluator
            onError={(error) => updateAppState({ error })}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  🔥 Wildfire Risk Assessment
                </h1>
              </div>
            </div>

            {/* User Role Switcher */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Role:</label>
              <select
                value={appState.userRole}
                onChange={(e) =>
                  updateAppState({
                    userRole: e.target.value as UserRole,
                    currentView:
                      e.target.value === 'underwriter' ? 'evaluation' : 'rules'
                  })
                }
                className="rounded-md border-gray-300 text-sm"
              >
                <option value="underwriter">Underwriter</option>
                <option value="applied-science">Applied Science</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {filteredNavigation.map((item) => (
              <button
                key={item.id}
                onClick={() => updateAppState({ currentView: item.id })}
                className={classNames(
                  appState.currentView === item.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Error Banner */}
      {appState.error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{appState.error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => updateAppState({ error: null })}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </main>
    </div>
  )
}

export default App
