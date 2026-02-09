'use client'

import Link from 'next/link'
import type { LeaderboardItem } from '@/types'
import { NetworkIcon } from '@/components/common/NetworkIcons'

interface TopPodiumProps {
  items: LeaderboardItem[]
}

const medals = [
  { emoji: '', bg: 'from-yellow-400/20 to-yellow-500/5', border: 'border-yellow-400/40', ring: 'ring-yellow-400/20', text: 'text-yellow-600 dark:text-yellow-400' },
  { emoji: '', bg: 'from-gray-300/20 to-gray-400/5', border: 'border-gray-400/40', ring: 'ring-gray-400/20', text: 'text-gray-500 dark:text-gray-400' },
  { emoji: '', bg: 'from-orange-400/20 to-orange-500/5', border: 'border-orange-400/40', ring: 'ring-orange-400/20', text: 'text-orange-600 dark:text-orange-400' },
]

export function TopPodium({ items }: TopPodiumProps) {
  if (items.length === 0) return null

  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = items.length >= 3
    ? [items[1], items[0], items[2]]
    : items

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {podiumOrder.map((item) => {
        const idx = item.rank - 1
        const medal = medals[idx] || medals[2]
        const isFirst = item.rank === 1

        return (
          <div
            key={item.agent_id}
            className={`
              relative p-5 rounded-2xl border bg-gradient-to-b
              ${medal.bg} ${medal.border}
              ${isFirst ? 'md:-mt-4 md:pb-7 ring-2 ' + medal.ring : ''}
              transition-all hover:scale-[1.02]
            `}
          >
            {/* Rank badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-2xl font-bold ${medal.text}`}>
                #{item.rank}
              </span>
              <div className={`text-sm font-semibold px-3 py-1 rounded-full ${medal.text} bg-white/60 dark:bg-black/20`}>
                {item.score.toFixed(1)}
              </div>
            </div>

            {/* Agent info */}
            <Link
              href={`/agents/${item.agent_id}`}
              className="block mb-3"
            >
              <h3 className="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa] truncate hover:underline">
                {item.agent_name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <NetworkIcon networkName={item.network_key} className="w-3.5 h-3.5" />
                <span className="text-xs text-[#737373]">
                  #{item.token_id} on {item.network_key}
                </span>
              </div>
            </Link>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <ScorePill label="Service" value={item.service_score} />
              <ScorePill label="Usage" value={item.usage_score} />
              <ScorePill label="Quality" value={item.quality_score} />
              <ScorePill label="Profile" value={item.profile_score} />
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${item.has_working_endpoints ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-[11px] text-[#737373]">
                  {item.has_working_endpoints ? 'Online' : 'Offline'}
                </span>
              </div>
              <span className="text-[11px] text-[#737373]">
                {item.reputation_count} feedbacks
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-2 py-1 bg-white/40 dark:bg-black/10 rounded-md">
      <span className="text-[10px] text-[#737373] uppercase">{label}</span>
      <span className="text-[11px] font-medium text-[#525252] dark:text-[#a3a3a3]">
        {value.toFixed(0)}
      </span>
    </div>
  )
}
