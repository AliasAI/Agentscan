'use client'

import { useState } from 'react'

interface StatCardData {
  label: string
  value: number | string
  icon: React.ReactNode
  color?: 'green' | 'blue' | 'purple'
  tooltip?: string
  subtitle?: string
}

interface StatsCardsProps {
  cards: StatCardData[]
}

export function StatsCards({ cards }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}

function StatCard({ label, value, icon, color, tooltip, subtitle }: StatCardData) {
  const [showTooltip, setShowTooltip] = useState(false)

  const valueColor =
    color === 'green' ? 'text-green-600 dark:text-green-400' :
    color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
    color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
    'text-[#0a0a0a] dark:text-[#fafafa]'

  return (
    <div className="p-4 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626]">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] text-[#737373] uppercase tracking-wider font-medium flex-1 truncate">
          {label}
        </span>
        {tooltip && (
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              className="text-[#a3a3a3] hover:text-[#737373] cursor-help transition-colors flex-shrink-0"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {showTooltip && (
              <div className="absolute z-50 bottom-full right-0 mb-2 px-2 py-1.5 bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] text-[10px] rounded-md shadow-lg w-44 leading-relaxed">
                {tooltip}
                <div className="absolute top-full right-2 border-4 border-transparent border-t-[#0a0a0a] dark:border-t-[#fafafa]" />
              </div>
            )}
          </div>
        )}
      </div>
      <p className={`text-xl font-semibold ${valueColor}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="text-[10px] text-[#737373] mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}

// Pre-built stat card icon SVGs for reuse
export const StatIcons = {
  activeAgents: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-green-500">
      <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  workingEndpoints: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-500">
      <path d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6898C16.4231 14.4392 17.0331 14.0471 17.54 13.54L20.54 10.54C21.4508 9.59699 21.9548 8.33398 21.9434 7.02298C21.932 5.71198 21.4061 4.45794 20.4791 3.53094C19.5521 2.60394 18.2981 2.07802 16.9871 2.06663C15.6761 2.05523 14.4131 2.55918 13.47 3.46998L11.75 5.17998" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60707C11.7643 9.26331 11.0685 9.05889 10.3533 9.00768C9.63816 8.95648 8.92037 9.05963 8.24861 9.31023C7.57685 9.56082 6.96684 9.95294 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04522 15.666 2.05662 16.977C2.06801 18.288 2.59394 19.542 3.52094 20.469C4.44794 21.396 5.70197 21.922 7.01297 21.9334C8.32398 21.9448 9.58699 21.4408 10.53 20.53L12.24 18.82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  totalFeedbacks: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-purple-500">
      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}
