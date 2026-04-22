'use client'

import Link from 'next/link'
import type { Agent, TrendingAgentsResponse } from '@/types'
import { TrendingSectionSkeleton } from '@/components/common/Skeleton'
import { formatTimeAgo, formatReputationScore } from '@/lib/utils/format'

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
    icon: 'text-[#111111] dark:text-[#fafafa]',
    bg: 'bg-[#f4efe2] dark:bg-[#171717]',
    badge: 'bg-[#efe6c6] text-[#6b5315] dark:bg-[#242017] dark:text-[#d8b85b]',
  },
  purple: {
    icon: 'text-[#111111] dark:text-[#fafafa]',
    bg: 'bg-[#f1ece7] dark:bg-[#171717]',
    badge: 'bg-[#ede6e0] text-[#5c5047] dark:bg-[#24201d] dark:text-[#d0c6bd]',
  },
  green: {
    icon: 'text-[#111111] dark:text-[#fafafa]',
    bg: 'bg-[#e9f1ea] dark:bg-[#141814]',
    badge: 'bg-[#dbe9db] text-[#35563a] dark:bg-[#1c261d] dark:text-[#82c28c]',
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
    <div className="relative overflow-hidden rounded-2xl border border-[#e0e0e0] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(250,250,250,0.96)_100%)] p-3.5 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_12px_30px_rgba(10,10,10,0.04)] backdrop-blur-lg dark:border-[#2b2b2b] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.86)_0%,rgba(18,18,18,0.94)_100%)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.26),0_16px_32px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
      <div className="flex items-center gap-2 mb-2.5">
        <div className={`p-1.5 rounded-md ${styles.bg}`}>
          <span className={styles.icon}>{icon}</span>
        </div>
        <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
          {title}
        </h3>
      </div>

      <div className="space-y-1">
        {agents.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-[#737373]">No agents yet</p>
          </div>
        ) : (
          agents.map((agent, index) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="group relative flex items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-[background-color,border-color,box-shadow] hover:border-[#e5e5e5] hover:bg-[rgba(250,250,250,0.95)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] dark:hover:border-[#2f2f2f] dark:hover:bg-[#111111] dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              <span className="text-xs font-medium text-[#a3a3a3] dark:text-[#525252] w-4 text-center">
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] truncate group-hover:text-[#525252] dark:group-hover:text-[#d4d4d4] transition-colors">
                  {agent.name}
                </div>
                <div className="text-[10px] text-[#737373] truncate">
                  {agent.network_name || agent.network_id}
                </div>
              </div>

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
        <h2 className="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
          Snapshot
        </h2>
        <TrendingSectionSkeleton />
      </div>
    )
  }

  return (
    <div className="relative mb-8 rounded-[28px] border border-[#e2e2e2] bg-[linear-gradient(180deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.3)_100%)] px-3 py-4 dark:border-[#252525] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)]">
      <div className="pointer-events-none absolute left-0 top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.45),transparent_70%)] opacity-70 blur-3xl animate-[pulse_12s_ease-in-out_infinite] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_70%)]" />
      <div className="mb-4 border-b border-[#e5e5e5]/80 pb-3 dark:border-[#262626]/90">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373] mb-1">
          Snapshot
        </div>
        <h2 className="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
          Top ranked, reviewed, and recent
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              ? formatReputationScore(agent.reputation_score, 1)
              : '-'
          }
          accentColor="gold"
        />

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
