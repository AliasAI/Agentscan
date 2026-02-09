'use client'

import Link from 'next/link'
import type { AgentTxRanking } from '@/types'
import { NetworkIcon } from '@/components/common/NetworkIcons'

interface TopAgentsTableProps {
  agents: AgentTxRanking[]
}

export function TopAgentsTable({ agents }: TopAgentsTableProps) {
  if (agents.length === 0) {
    return (
      <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-[#737373]">No agent activity yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] dark:border-[#262626]">
        <h3 className="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
          Top Agents
        </h3>
        <Link
          href="/leaderboard"
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View Full Leaderboard
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12H19M12 5L19 12L12 19" />
          </svg>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#fafafa] dark:bg-[#0a0a0a]">
            <tr>
              <th className="px-4 py-2.5 text-left text-[10px] font-medium text-[#737373] uppercase tracking-wider w-12">Rank</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-medium text-[#737373] uppercase tracking-wider">Agent</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-medium text-[#737373] uppercase tracking-wider hidden md:table-cell">Network</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium text-[#737373] uppercase tracking-wider">Feedbacks</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium text-[#737373] uppercase tracking-wider hidden sm:table-cell">Score Updates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
            {agents.map((agent, index) => (
              <tr key={agent.agent_id} className="hover:bg-[#fafafa] dark:hover:bg-[#111111] transition-colors">
                <td className="px-4 py-3">
                  <RankBadge rank={index + 1} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/agents/${agent.agent_id}`}
                    className="font-medium text-sm text-[#0a0a0a] dark:text-[#fafafa] hover:underline truncate block max-w-[200px]"
                  >
                    {agent.agent_name}
                  </Link>
                  <span className="text-[11px] text-[#737373]">#{agent.token_id}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <NetworkIcon networkName={agent.network_key} className="w-4 h-4" />
                    <span className="text-xs text-[#525252] dark:text-[#a3a3a3] capitalize">{agent.network_key}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-[#0a0a0a] dark:text-[#fafafa]">
                  {agent.total_transactions}
                </td>
                <td className="px-4 py-3 text-right text-sm text-[#525252] dark:text-[#a3a3a3] hidden sm:table-cell">
                  {agent.reputation_update_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const style =
    rank === 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
    rank === 2 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
    rank === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
    'bg-[#f5f5f5] dark:bg-[#262626] text-[#737373]'

  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${style}`}>
      {rank}
    </div>
  )
}
