'use client'

import Link from 'next/link'
import type { LeaderboardItem } from '@/types'
import { ScoreCell } from './ScoreBar'
import { NetworkIcon } from '@/components/common/NetworkIcons'

interface RankTableProps {
  items: LeaderboardItem[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function RankTable({ items, page, totalPages, onPageChange }: RankTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-[#f5f5f5] dark:bg-[#171717] rounded-2xl flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3]">
            <path d="M12 15L8.5 8.5L1 7L5.5 11.5L4.5 19L12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 15L15.5 8.5L23 7L18.5 11.5L19.5 19L12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">
          No agents found
        </h3>
        <p className="text-sm text-[#737373]">
          Try changing the network filter
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e5e5] dark:border-[#262626]">
              <th className="text-left text-[10px] font-medium text-[#737373] uppercase tracking-wider py-3 px-3 w-12">Rank</th>
              <th className="text-left text-[10px] font-medium text-[#737373] uppercase tracking-wider py-3 px-3">Agent</th>
              <th className="text-left text-[10px] font-medium text-[#737373] uppercase tracking-wider py-3 px-3 hidden lg:table-cell">Network</th>
              <th className="text-center text-[10px] font-medium text-[#737373] uppercase tracking-wider py-3 px-3 w-20">Score</th>
              <th className="text-left text-[10px] font-medium text-[#737373] uppercase tracking-wider py-3 px-3 w-24 hidden md:table-cell">Service</th>
              <th className="text-left text-[10px] font-medium text-[#737373] uppercase tracking-wider py-3 px-3 w-24 hidden md:table-cell">Usage</th>
              <th className="text-left text-[10px] font-medium text-[#737373] uppercase tracking-wider py-3 px-3 w-24 hidden lg:table-cell">Freshness</th>
              <th className="text-left text-[10px] font-medium text-[#737373] uppercase tracking-wider py-3 px-3 w-24 hidden lg:table-cell">Profile</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.agent_id}
                className="border-b border-[#f5f5f5] dark:border-[#1a1a1a] hover:bg-[#fafafa] dark:hover:bg-[#111111] transition-colors"
              >
                {/* Rank */}
                <td className="py-3 px-3">
                  <span className="text-sm font-semibold text-[#525252] dark:text-[#a3a3a3]">
                    {item.rank}
                  </span>
                </td>

                {/* Agent */}
                <td className="py-3 px-3">
                  <Link
                    href={`/agents/${item.agent_id}`}
                    className="font-medium text-sm text-[#0a0a0a] dark:text-[#fafafa] hover:underline truncate block max-w-[200px]"
                  >
                    {item.agent_name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-[#737373]">#{item.token_id}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${item.has_working_endpoints ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-[11px] text-[#737373]">{item.reputation_count} feedbacks</span>
                  </div>
                </td>

                {/* Network */}
                <td className="py-3 px-3 hidden lg:table-cell">
                  <div className="flex items-center gap-1.5">
                    <NetworkIcon networkName={item.network_key} className="w-4 h-4" />
                    <span className="text-xs text-[#525252] dark:text-[#a3a3a3] capitalize">{item.network_key}</span>
                  </div>
                </td>

                {/* Total Score */}
                <td className="py-3 px-3 text-center">
                  <span className={`text-sm font-bold ${
                    item.score >= 70 ? 'text-green-600 dark:text-green-400' :
                    item.score >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-[#737373]'
                  }`}>
                    {item.score.toFixed(1)}
                  </span>
                </td>

                {/* Sub-scores */}
                <td className="py-3 px-3 hidden md:table-cell">
                  <ScoreCell label="" value={item.service_score} color="green" />
                </td>
                <td className="py-3 px-3 hidden md:table-cell">
                  <ScoreCell label="" value={item.usage_score} color="blue" />
                </td>
                <td className="py-3 px-3 hidden lg:table-cell">
                  <ScoreCell label="" value={item.freshness_score} color="purple" />
                </td>
                <td className="py-3 px-3 hidden lg:table-cell">
                  <ScoreCell label="" value={item.profile_score} color="orange" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#e5e5e5] dark:border-[#262626]">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] disabled:opacity-30 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-[#737373]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] disabled:opacity-30 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
