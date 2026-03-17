'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { networkService } from '@/lib/api/services'
import { NetworkIcon } from '@/components/common/NetworkIcons'
import type { Network, NetworkWithStats } from '@/types'

// CREATE2 shared contract addresses (all mainnets)
const SHARED_CONTRACTS = {
  identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
}

// External ERC-8004 implementations (non-EVM, linked in header description)
const EXTERNAL_NETWORK_COUNT = 1 // Solana (SATI)

function CopyableAddress({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="group/addr flex items-center gap-3 py-2">
      <span className="text-[11px] font-medium text-[#737373] w-36 shrink-0">{label}</span>
      <code className="font-mono text-[11px] text-[#525252] dark:text-[#a3a3a3] truncate flex-1 min-w-0">
        {address}
      </code>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(address)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        className="opacity-0 group-hover/addr:opacity-100 p-1.5 hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded transition-all shrink-0"
        title="Copy address"
      >
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#22c55e]">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )}
      </button>
    </div>
  )
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

export default function NetworksPage() {
  const [networks, setNetworks] = useState<Network[]>([])
  const [networkStats, setNetworkStats] = useState<NetworkWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      networkService.getNetworks(),
      networkService.getNetworksWithStats(),
    ])
      .then(([networksData, statsData]) => {
        setNetworks(networksData)
        setNetworkStats(statsData)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch networks:', error)
        setLoading(false)
      })
  }, [])

  // Merge & sort by agent count (descending)
  const mergedNetworks = networks
    .map(n => ({
      network: n,
      agentCount: networkStats.find(s => s.id === n.id)?.agent_count ?? 0,
    }))
    .sort((a, b) => b.agentCount - a.agentCount)

  const totalAgents = networkStats.reduce((sum, s) => sum + s.agent_count, 0)
  const maxAgents = mergedNetworks.length > 0 ? mergedNetworks[0].agentCount : 0

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Page Header */}
      <div className="border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <nav className="flex items-center gap-2 text-xs text-[#737373] mb-4">
            <Link href="/" className="hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors">
              Home
            </Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#d4d4d4] dark:text-[#404040]">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[#0a0a0a] dark:text-[#fafafa] font-medium">Networks</span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="text-2xl lg:text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-3 tracking-tight">
              Supported Networks
            </h1>
            <p className="text-sm text-[#525252] dark:text-[#a3a3a3] mb-4 leading-relaxed">
              ERC-8004 registry contracts are deployed across multiple networks via CREATE2 deterministic deployment, sharing the same contract addresses on every chain.
            </p>
            <p className="text-sm text-[#525252] dark:text-[#a3a3a3] mb-6 leading-relaxed">
              Beyond EVM chains, the protocol extends to{' '}
              <a
                href="https://sati.cascade.fyi/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b5cf6] hover:text-[#7c3aed] font-medium inline-flex items-center gap-0.5"
              >
                SATI on Solana
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="inline">
                  <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 7H17V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              {' '}by Cascade Protocol.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#525252] dark:text-[#a3a3a3]">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 12H22" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa]">
                  {networks.length + EXTERNAL_NETWORK_COUNT} Networks
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#525252] dark:text-[#a3a3a3]">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa]">
                  {totalAgents.toLocaleString()} Total Agents
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Shared Contracts */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
              ERC-8004 Registry Contracts
            </h2>
            <span className="text-[10px] font-medium text-[#22c55e] bg-[#f0fdf4] dark:bg-[#14532d]/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              CREATE2
            </span>
          </div>
          <p className="text-xs text-[#737373] mb-4">
            All networks share the same contract addresses via CREATE2 deterministic deployment.
          </p>
          <div className="divide-y divide-[#f5f5f5] dark:divide-[#262626]">
            <CopyableAddress label="Identity Registry" address={SHARED_CONTRACTS.identity} />
            <CopyableAddress label="Reputation Registry" address={SHARED_CONTRACTS.reputation} />
          </div>
        </div>

        {/* Network List */}
        {loading ? (
          <ListSkeleton />
        ) : networks.length === 0 ? (
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
        ) : (
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
        )}
      </div>
    </div>
  )
}
