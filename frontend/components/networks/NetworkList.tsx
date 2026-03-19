'use client'

import Link from 'next/link'
import { NetworkIcon } from '@/components/common/NetworkIcons'
import type { Network } from '@/types'

interface MergedNetwork {
  network: Network
  agentCount: number
}

interface NetworkListProps {
  mergedNetworks: MergedNetwork[]
  maxAgents: number
  loading: boolean
}

function ListSkeleton() {
  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a] last:border-b-0">
          <div className="flex items-center gap-3 w-40 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] dark:bg-[#262626]" />
            <div className="h-4 w-20 bg-[#f5f5f5] dark:bg-[#262626] rounded" />
          </div>
          <div className="hidden md:block w-20 shrink-0">
            <div className="h-3 w-10 bg-[#f5f5f5] dark:bg-[#262626] rounded" />
          </div>
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[#f5f5f5] dark:bg-[#262626] rounded-full" />
            <div className="h-4 w-12 bg-[#f5f5f5] dark:bg-[#262626] rounded" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] dark:bg-[#262626]" />
        </div>
      ))}
    </div>
  )
}

function NetworkRow({
  network,
  agentCount,
  maxAgents,
}: {
  network: Network
  agentCount: number
  maxAgents: number
}) {
  const barPercent = maxAgents > 0 ? (agentCount / maxAgents) * 100 : 0
  const isEmpty = agentCount === 0

  return (
    <Link
      href={isEmpty ? '#' : `/agents?network=${network.id}`}
      className={`group flex items-center gap-4 px-5 py-3 transition-colors border-b border-[#f5f5f5] dark:border-[#1a1a1a] last:border-b-0 ${
        isEmpty
          ? 'opacity-40 cursor-default'
          : 'hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]/50 cursor-pointer'
      }`}
      onClick={isEmpty ? (e: React.MouseEvent) => e.preventDefault() : undefined}
    >
      {/* Icon + Name */}
      <div className="flex items-center gap-3 w-40 md:w-44 shrink-0">
        <div className="w-8 h-8 bg-[#f5f5f5] dark:bg-[#262626] rounded-lg flex items-center justify-center shrink-0">
          <NetworkIcon networkName={network.name} className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className={`text-sm font-medium truncate ${
            isEmpty ? 'text-[#a3a3a3] dark:text-[#525252]' : 'text-[#0a0a0a] dark:text-[#fafafa] group-hover:text-[#3b82f6]'
          } transition-colors`}>
            {network.name}
          </div>
          <div className="text-[11px] text-[#a3a3a3] md:hidden">Chain {network.chain_id}</div>
        </div>
      </div>

      {/* Chain ID - desktop only */}
      <div className="hidden md:block text-xs text-[#737373] w-20 shrink-0 tabular-nums">
        {network.chain_id}
      </div>

      {/* Agent bar + count */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="flex-1 h-1.5 bg-[#f5f5f5] dark:bg-[#262626] rounded-full overflow-hidden">
          {barPercent > 0 && (
            <div
              className="h-full bg-[#0a0a0a] dark:bg-[#fafafa] rounded-full transition-all duration-700 opacity-[0.15]"
              style={{ width: `${barPercent}%` }}
            />
          )}
        </div>
        <span className={`text-sm font-semibold w-16 text-right tabular-nums shrink-0 ${
          isEmpty ? 'text-[#d4d4d4] dark:text-[#404040]' : 'text-[#0a0a0a] dark:text-[#fafafa]'
        }`}>
          {agentCount.toLocaleString()}
        </span>
      </div>

      {/* Explorer link */}
      <span
        onClick={(e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          window.open(network.explorer_url, '_blank')
        }}
        className="p-1.5 text-[#d4d4d4] dark:text-[#404040] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded-lg transition-all shrink-0 cursor-pointer"
        title={`View on ${network.name} explorer`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </Link>
  )
}

export default function NetworkList({ mergedNetworks, maxAgents, loading }: NetworkListProps) {
  if (loading) {
    return <ListSkeleton />
  }

  if (mergedNetworks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-[#f5f5f5] dark:bg-[#171717] rounded-2xl flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3] dark:text-[#525252]">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 12H22" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">
          No networks available
        </h3>
        <p className="text-sm text-[#737373] text-center max-w-md">
          Network data is currently unavailable. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
      {/* Column header */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-b border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]/50">
        <div className="w-40 md:w-44 shrink-0 text-[10px] uppercase tracking-wider text-[#a3a3a3] font-medium">
          Network
        </div>
        <div className="hidden md:block w-20 shrink-0 text-[10px] uppercase tracking-wider text-[#a3a3a3] font-medium">
          Chain ID
        </div>
        <div className="flex-1 text-[10px] uppercase tracking-wider text-[#a3a3a3] font-medium text-right">
          Agents
        </div>
        <div className="w-9 shrink-0" />
      </div>

      {/* Rows */}
      {mergedNetworks.map(({ network, agentCount }) => (
        <NetworkRow
          key={network.id}
          network={network}
          agentCount={agentCount}
          maxAgents={maxAgents}
        />
      ))}
    </div>
  )
}
