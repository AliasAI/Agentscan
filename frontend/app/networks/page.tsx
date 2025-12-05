'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { networkService } from '@/lib/api/services'
import { NetworkIcon } from '@/components/common/NetworkIcons'
import type { Network, NetworkWithStats } from '@/types'

// Network card skeleton
function NetworkCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6 animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] dark:bg-[#262626]" />
          <div>
            <div className="h-5 w-32 bg-[#f5f5f5] dark:bg-[#262626] rounded mb-2" />
            <div className="h-4 w-20 bg-[#f5f5f5] dark:bg-[#262626] rounded" />
          </div>
        </div>
        <div className="h-6 w-16 bg-[#f5f5f5] dark:bg-[#262626] rounded-full" />
      </div>
      <div className="space-y-4">
        <div className="h-4 w-full bg-[#f5f5f5] dark:bg-[#262626] rounded" />
        <div className="h-4 w-3/4 bg-[#f5f5f5] dark:bg-[#262626] rounded" />
      </div>
    </div>
  )
}

// Contract address display component
function ContractAddress({
  label,
  address,
  explorerUrl,
}: {
  label: string
  address: string
  explorerUrl: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group">
      <div className="text-[10px] uppercase tracking-wider text-[#a3a3a3] dark:text-[#525252] mb-1.5 font-medium">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`${explorerUrl}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-[#525252] dark:text-[#a3a3a3] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors truncate flex-1"
        >
          {address}
        </a>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded transition-all"
          title="Copy address"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#22c55e]">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// Network card component
function NetworkCard({
  network,
  stats,
  index,
}: {
  network: Network
  stats?: NetworkWithStats
  index: number
}) {
  const agentCount = stats?.agent_count ?? 0

  return (
    <div
      className="group bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6 hover:border-[#d4d4d4] dark:hover:border-[#404040] hover:shadow-lg transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Network icon with glow effect on hover */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#0a0a0a] dark:bg-[#fafafa] rounded-xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300" />
            <div className="relative w-12 h-12 bg-[#f5f5f5] dark:bg-[#262626] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <NetworkIcon networkName={network.name} className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
              {network.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#737373] dark:text-[#737373]">
              <span>Chain ID: {network.chain_id}</span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f0fdf4] dark:bg-[#14532d]/30 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-[10px] font-medium text-[#22c55e] dark:text-[#4ade80] uppercase tracking-wider">
            Active
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg">
          <div className="text-[10px] uppercase tracking-wider text-[#a3a3a3] dark:text-[#525252] mb-1">
            Agents
          </div>
          <div className="text-xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
            {agentCount.toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg">
          <div className="text-[10px] uppercase tracking-wider text-[#a3a3a3] dark:text-[#525252] mb-1">
            Explorer
          </div>
          <a
            href={network.explorer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] hover:text-[#525252] dark:hover:text-[#a3a3a3] transition-colors inline-flex items-center gap-1"
          >
            View
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-50">
              <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Contracts section */}
      {network.contracts && (
        <div className="pt-5 border-t border-[#e5e5e5] dark:border-[#262626]">
          <div className="flex items-center gap-2 mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs font-semibold text-[#525252] dark:text-[#a3a3a3] uppercase tracking-wider">
              Smart Contracts
            </span>
          </div>

          <div className="space-y-4">
            <ContractAddress
              label="Identity Registry"
              address={network.contracts.identity}
              explorerUrl={network.explorer_url}
            />
            <ContractAddress
              label="Reputation Registry"
              address={network.contracts.reputation}
              explorerUrl={network.explorer_url}
            />
            <ContractAddress
              label="Validation Registry"
              address={network.contracts.validation}
              explorerUrl={network.explorer_url}
            />
          </div>
        </div>
      )}
    </div>
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

  const getNetworkStats = (networkId: string) => {
    return networkStats.find(s => s.id === networkId)
  }

  const totalAgents = networkStats.reduce((sum, s) => sum + s.agent_count, 0)

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Page Header */}
      <div className="relative border-b border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(to right, #0a0a0a 1px, transparent 1px),
                linear-gradient(to bottom, #0a0a0a 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          {/* Radial gradient overlay */}
          <div
            className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.03]"
            style={{
              background: 'radial-gradient(circle at center, #0a0a0a 0%, transparent 70%)',
              transform: 'translate(30%, -30%)',
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12 relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#737373] mb-4">
            <Link href="/" className="hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors">
              Home
            </Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#d4d4d4] dark:text-[#404040]">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[#0a0a0a] dark:text-[#fafafa] font-medium">Networks</span>
          </nav>

          {/* Title section */}
          <div className="max-w-3xl">
            <h1 className="text-2xl lg:text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-3 tracking-tight">
              Supported Networks
            </h1>
            <p className="text-sm text-[#525252] dark:text-[#a3a3a3] mb-6 leading-relaxed">
              ERC-8004 AI Agents are deployed across multiple blockchain networks. Each network has its own set of registry contracts for identity, reputation, and validation.
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
                  {networks.length} Networks
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

      {/* Networks grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <NetworkCardSkeleton key={i} />
            ))}
          </div>
        ) : networks.length === 0 ? (
          /* Empty state */
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
            <p className="text-sm text-[#737373] dark:text-[#737373] text-center max-w-md">
              Network data is currently unavailable. Please try again later.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {networks.map((network, index) => (
              <NetworkCard
                key={network.id}
                network={network}
                stats={getNetworkStats(network.id)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
