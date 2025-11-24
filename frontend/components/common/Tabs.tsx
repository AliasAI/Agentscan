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
    <div className="border-b border-[#e5e5e5] dark:border-[#262626]">
      <nav className="flex space-x-4" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              whitespace-nowrap py-2 px-0.5 border-b-2 font-medium text-xs transition-all duration-200
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]
              ${
                currentTab === tab.id
                  ? 'border-[#0a0a0a] text-[#0a0a0a] dark:border-[#fafafa] dark:text-[#fafafa]'
                  : 'border-transparent text-[#737373] hover:text-[#525252] hover:border-[#d4d4d4] dark:text-[#737373] dark:hover:text-[#a3a3a3]'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`
                  ml-1.5 py-0.5 px-1.5 rounded text-[10px]
                  ${
                    currentTab === tab.id
                      ? 'bg-[#0a0a0a] text-white dark:bg-[#fafafa] dark:text-[#0a0a0a]'
                      : 'bg-[#f5f5f5] text-[#737373] dark:bg-[#262626] dark:text-[#737373]'
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
