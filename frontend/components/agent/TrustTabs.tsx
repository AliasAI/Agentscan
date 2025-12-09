'use client'

import { useState, useCallback } from 'react'
import { FeedbackList } from './FeedbackList'
import { ValidationList } from './ValidationList'

interface TrustTabsProps {
  agentId: string
  initialFeedbackCount?: number
  initialValidationCount?: number
}

type TabType = 'reviews' | 'validations'

export function TrustTabs({
  agentId,
  initialFeedbackCount = 0,
  initialValidationCount = 0,
}: TrustTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('reviews')
  const [feedbackCount, setFeedbackCount] = useState(initialFeedbackCount)
  const [validationCount, setValidationCount] = useState(initialValidationCount)

  const handleFeedbackCountChange = useCallback((count: number) => {
    setFeedbackCount(count)
  }, [])

  const handleValidationCountChange = useCallback((count: number) => {
    setValidationCount(count)
  }, [])

  const tabs: { id: TabType; label: string; count: number; icon: JSX.Element }[] = [
    {
      id: 'reviews',
      label: 'Reviews',
      count: feedbackCount,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'validations',
      label: 'Validations',
      count: validationCount,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] animate-fade-in" style={{ animationDelay: '400ms' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] uppercase tracking-wider">
            Trust & Reputation
          </h2>
          {/* The Graph data source indicator */}
          <a
            href="https://thegraph.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#f5f5f5] dark:bg-[#262626] rounded-md text-[10px] text-[#737373] hover:text-[#525252] dark:hover:text-[#a3a3a3] transition-colors"
            title="Data indexed by The Graph protocol"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#6747ED]">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
            </svg>
            <span>via The Graph</span>
          </a>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 p-1 bg-[#f5f5f5] dark:bg-[#0a0a0a] rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-white dark:bg-[#262626] text-[#0a0a0a] dark:text-[#fafafa] shadow-sm'
                  : 'text-[#737373] hover:text-[#525252] dark:hover:text-[#a3a3a3]'
                }
              `}
            >
              <span className={activeTab === tab.id ? 'text-[#0a0a0a] dark:text-[#fafafa]' : 'text-[#a3a3a3]'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`
                    min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center
                    ${activeTab === tab.id
                      ? 'bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a]'
                      : 'bg-[#e5e5e5] dark:bg-[#404040] text-[#737373] dark:text-[#a3a3a3]'
                    }
                  `}
                >
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 pb-6 pt-4">
        {activeTab === 'reviews' && (
          <FeedbackList
            agentId={agentId}
            onCountChange={handleFeedbackCountChange}
          />
        )}
        {activeTab === 'validations' && (
          <ValidationList
            agentId={agentId}
            onCountChange={handleValidationCountChange}
          />
        )}
      </div>
    </div>
  )
}
