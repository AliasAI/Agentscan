'use client'

import Link from 'next/link'
import type { RecentActivityItem } from '@/types'
import { NetworkIcon } from '@/components/common/NetworkIcons'
import { getExplorerUrl } from '@/lib/networks'

interface RecentActivityProps {
  activities: RecentActivityItem[]
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  registered: {
    label: 'Registered',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: '+ ',
  },
  reputation_update: {
    label: 'Feedback',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: '\u2605 ',
  },
  validation_complete: {
    label: 'Validated',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: '\u2713 ',
  },
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-[#737373]">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] dark:border-[#262626]">
        <h3 className="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
          Recent Activity
        </h3>
        <span className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-wider">
          Latest on-chain events
        </span>
      </div>

      <div className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
        {activities.map((item) => {
          const config = TYPE_CONFIG[item.activity_type] || TYPE_CONFIG.registered
          const explorerUrl = getExplorerUrl(item.network_key)

          return (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafafa] dark:hover:bg-[#111111] transition-colors">
              {/* Type badge */}
              <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${config.color}`}>
                {config.icon}{config.label}
              </span>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/agents/${item.agent_id}`}
                    className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] hover:underline truncate"
                  >
                    {item.agent_name}
                  </Link>
                  <span className="text-[10px] text-[#a3a3a3] shrink-0">
                    #{item.token_id}
                  </span>
                </div>
              </div>

              {/* Network */}
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                <NetworkIcon networkName={item.network_key} className="w-3.5 h-3.5" />
                <span className="text-[11px] text-[#737373] capitalize">{item.network_key}</span>
              </div>

              {/* Tx hash */}
              {item.tx_hash && (
                <a
                  href={`${explorerUrl}/tx/${item.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline text-[10px] font-mono text-blue-500 hover:text-blue-600 shrink-0"
                >
                  {truncateHash(item.tx_hash)}
                </a>
              )}

              {/* Time */}
              <span className="text-[11px] text-[#a3a3a3] shrink-0 w-14 text-right">
                {formatRelativeTime(item.created_at)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
