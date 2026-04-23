import Link from 'next/link'
import type { Agent } from '@/types'
import { formatAddress, formatReputationScore, formatTimeAgo } from '@/lib/utils/format'
import { NetworkIcon } from '@/components/common/NetworkIcons'
import { EcosystemBadges } from './EcosystemBadges'

interface AgentListRowProps {
  agent: Agent
  isLast?: boolean
}

export function AgentListRow({ agent, isLast = false }: AgentListRowProps) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className={`block px-4 py-3.5 transition-[background-color,border-color,box-shadow] hover:bg-[rgba(250,250,250,0.95)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:hover:bg-[rgba(255,255,255,0.04)] dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${!isLast ? 'border-b border-[#ebebeb] dark:border-[#2a2a2a]' : ''}`}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_96px_88px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
              {agent.name}
            </span>
            {agent.token_id !== undefined && agent.token_id !== null && (
              <span className="text-[10px] text-[#737373] dark:text-[#737373] font-mono">
                #{agent.token_id}
              </span>
            )}
            {agent.network_name && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#737373] dark:text-[#737373]">
                <NetworkIcon networkName={agent.network_name} className="w-3.5 h-3.5" />
                {agent.network_name}
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#737373] dark:text-[#737373]">
            {formatAddress(agent.address, 12)}
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#525252] dark:text-[#a3a3a3]">
            {agent.description}
          </p>
        </div>

        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#737373] dark:text-[#737373] md:hidden mb-1">
            Signals
          </div>
          <EcosystemBadges
            ecosystems={agent.ecosystems}
            capabilities={agent.capabilities}
            tokenId={agent.token_id}
            agentWallet={agent.agent_wallet}
            isActive={agent.is_active}
            compact
          />
        </div>

        <div className="text-left md:text-right">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#737373] dark:text-[#737373] md:hidden mb-1">
            Trust
          </div>
          <div className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] tabular-nums">
            {(agent.reputation_count || 0) > 0 ? formatReputationScore(agent.reputation_score) : 'No score'}
          </div>
          <div className="mt-1 text-[11px] text-[#737373] dark:text-[#737373]">
            {(agent.reputation_count || 0) > 0
              ? `${agent.reputation_count} review${agent.reputation_count === 1 ? '' : 's'}`
              : 'No reviews'}
          </div>
        </div>

        <div className="text-left md:text-right">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#737373] dark:text-[#737373] md:hidden mb-1">
            Updated
          </div>
          <div className="text-[11px] text-[#737373] dark:text-[#737373]">
            {formatTimeAgo(agent.updated_at)}
          </div>
        </div>
      </div>
    </Link>
  )
}

// Shared table header for the agent list
export function AgentListHeader() {
  return (
    <div className="hidden md:grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_96px_88px] gap-4 px-4 py-2.5 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(247,247,247,0.86)_100%)] dark:bg-[linear-gradient(180deg,rgba(21,21,21,0.84)_0%,rgba(18,18,18,0.9)_100%)] text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
      <div>Agent</div>
      <div>Signals</div>
      <div className="text-right">Trust</div>
      <div className="text-right">Updated</div>
    </div>
  )
}

// Shared skeleton row for loading state
export function AgentListRowSkeleton() {
  return (
    <div className="px-4 py-3.5 animate-pulse">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_96px_88px]">
        <div className="space-y-2">
          <div className="h-4 w-36 bg-[#e5e5e5] dark:bg-[#262626] rounded" />
          <div className="h-3 w-24 bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded" />
          <div className="h-3 w-48 bg-[#f5f5f5] dark:bg-[#151515] rounded" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-14 bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded" />
          <div className="h-5 w-12 bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded" />
        </div>
        <div className="flex justify-end"><div className="h-4 w-12 bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded" /></div>
        <div className="flex justify-end"><div className="h-3 w-14 bg-[#f5f5f5] dark:bg-[#151515] rounded" /></div>
      </div>
    </div>
  )
}

// Container wrapper style constant
export const AGENT_LIST_CONTAINER_CLASS = "overflow-hidden rounded-2xl border border-[#ebebeb] dark:border-[#2b2b2b] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(251,251,251,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.86)_0%,rgba(18,18,18,0.94)_100%)] shadow-[0_1px_2px_rgba(10,10,10,0.04),0_18px_40px_rgba(10,10,10,0.05)] backdrop-blur-lg dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_20px_44px_rgba(0,0,0,0.24)]"
