'use client'

export interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab?: string
  defaultTab?: string
  onChange?: (tabId: string) => void
}

export default function Tabs({ tabs, activeTab, defaultTab, onChange }: TabsProps) {
  const currentTab = activeTab || defaultTab || tabs[0]?.id

  const handleTabChange = (tabId: string) => {
    onChange?.(tabId)
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex space-x-4" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              whitespace-nowrap py-2 px-0.5 border-b-2 font-medium text-xs transition-colors
              ${
                currentTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`
                  ml-1.5 py-0.5 px-1.5 rounded-full text-[10px]
                  ${
                    currentTab === tab.id
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
