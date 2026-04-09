'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { networkService } from '@/lib/api/services'
import ContractsCard from '@/components/networks/ContractsCard'
import ProtocolStackCard from '@/components/networks/ProtocolStackCard'
import NetworkList from '@/components/networks/NetworkList'
import type { Network, NetworkWithStats } from '@/types'

// External ERC-8004 implementations (non-EVM, linked in header description)
const EXTERNAL_NETWORK_COUNT = 1 // Solana (SATI)

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
        <ContractsCard />
        <ProtocolStackCard />
        <NetworkList mergedNetworks={mergedNetworks} maxAgents={maxAgents} loading={loading} />
      </div>
    </div>
  )
}
