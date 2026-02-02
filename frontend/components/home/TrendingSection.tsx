'use client'

import Link from 'next/link'
import type { Agent, TrendingAgentsResponse } from '@/types'
import { TrendingSectionSkeleton } from '@/components/common/Skeleton'
import { formatTimeAgo } from '@/lib/utils/format'

interface TrendingSectionProps {
  data: TrendingAgentsResponse | null
  isLoading: boolean
}

interface TrendingColumnProps {
  title: string
  icon: React.ReactNode
  agents: Agent[]
  formatValue: (agent: Agent) => string
  accentColor: 'gold' | 'purple' | 'green'
}

// Accent color styles mapping
const accentStyles = {
  gold: {
    icon: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  },
  purple: {
    icon: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  },
  green: {
    icon: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  },
}

function TrendingColumn({
  title,
  icon,
  agents,
  formatValue,
  accentColor,
}: TrendingColumnProps) {
  const styles = accentStyles[accentColor]

  return (
    <div className="bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626] p-4">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-md ${styles.bg}`}>
          <span className={styles.icon}>{icon}</span>
        </div>
        <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
          {title}
        </h3>
      </div>

      {/* Agent List */}
      <div className="space-y-1.5">
        {agents.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-[#737373]">No agents yet</p>
          </div>
        ) : (
          agents.map((agent, index) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors group"
            >
              {/* Rank number */}
              <span className="text-xs font-medium text-[#a3a3a3] dark:text-[#525252] w-4 text-center">
                {index + 1}
              </span>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] truncate group-hover:text-[#525252] dark:group-hover:text-[#d4d4d4] transition-colors">
                  {agent.name}
                </div>
                <div className="text-[10px] text-[#737373] truncate">
                  {agent.network_name || agent.network_id}
                </div>
              </div>

              {/* Value badge */}
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${styles.badge}`}
              >
                {formatValue(agent)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export function TrendingSection({ data, isLoading }: TrendingSectionProps) {
  if (isLoading || !data) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
          Trending Now
        </h2>
        <TrendingSectionSkeleton />
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-bold text-[#0a0a0a] dark:text-[#fafafa]">
          Trending Now
        </h2>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium rounded-full">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1952 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Quality
        </span>
      </div>
      <p className="text-[11px] text-[#737373] dark:text-[#525252] mb-4">
        Curated agents with complete profiles • Top Ranked by score • Featured by reviews • Trending by date
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Ranked - by reputation score */}
        <TrendingColumn
          title="Top Ranked"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          }
          agents={data.top_ranked}
          formatValue={(agent) =>
            agent.reputation_score > 0
              ? agent.reputation_score.toFixed(1)
              : '-'
          }
          accentColor="gold"
        />

        {/* Featured - by review count */}
        <TrendingColumn
          title="Featured"
          icon={
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          }
          agents={data.featured}
          formatValue={(agent) =>
            agent.reputation_count
              ? `${agent.reputation_count} reviews`
              : '0 reviews'
          }
          accentColor="purple"
        />

        {/* Trending - newest agents */}
        <TrendingColumn
          title="Trending"
          icon={
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          }
          agents={data.trending}
          formatValue={(agent) => formatTimeAgo(agent.created_at)}
          accentColor="green"
        />
      </div>
    </div>
  )
}
