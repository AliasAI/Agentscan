'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from 'next/image'

import { ecosystemService, agentService } from '@/lib/api/services'
import type { Agent, EcosystemSummaryItem } from '@/types'
import {
  AgentListRow,
  AgentListHeader,
  AgentListRowSkeleton,
  AGENT_LIST_CONTAINER_CLASS,
} from '@/components/agent/AgentListRow'

interface EcosystemConfig {
  title: string
  description: string
  href: string
  logoSrc: string
  logoAlt: string
  logoWidth: number
  logoHeight: number
  tags: string[]
  accent: { border: string; bg: string; badge: string; glow: string }
  lifecycle: Array<{ step: string; desc: string }>
}

const ECOSYSTEM_CONFIG: Record<string, EcosystemConfig> = {
  virtuals_acp: {
    title: 'Virtuals ACP',
    description: 'Commerce, offerings, resources, and job-capable agents discovered through the Agentic Commerce Protocol (ACP).',
    href: '/agents?ecosystem=virtuals_acp',
    logoSrc: '/brand-assets/virtuals-wordmark.svg',
    logoAlt: 'Virtuals Protocol',
    logoWidth: 112,
    logoHeight: 28,
    tags: ['Commerce', 'Offerings', 'Jobs', 'Real-time'],
    lifecycle: [
      { step: 'Discovery', desc: 'Agents publish their schemas and resources to the ACP network.' },
      { step: 'Offerings', desc: 'Services and capabilities are priced and offered for on-chain commerce.' },
      { step: 'Execution', desc: 'Escrow-backed transactions safely fulfill machine-to-machine requests.' }
    ],
    accent: {
      border: 'border-[#e5e5e5] hover:border-[#c4b5fd]/60 dark:border-[#262626] dark:hover:border-[#7c3aed]/40',
      bg: 'bg-[#f5f3ff] dark:bg-[#1a1428]',
      badge: 'bg-[#ede9fe] text-[#6d28d9] dark:bg-[#2d1f5e] dark:text-[#c4b5fd]',
      glow: 'bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.06),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.08),transparent_50%)]',
    },
  },
  bnbagent: {
    title: 'BNB Agent',
    description: 'Execution and job-oriented agents connected to the BNB ecosystem. Real-time updates on active jobs and on-chain footprint.',
    href: '/agents?ecosystem=bnbagent',
    logoSrc: '/brand-assets/bnb-mark.svg',
    logoAlt: 'BNB Chain',
    logoWidth: 28,
    logoHeight: 28,
    tags: ['Execution', 'Automation', 'Jobs', 'BNB Chain'],
    lifecycle: [
      { step: 'On-chain Identity', desc: 'Agents register their footprint and identity natively on the BNB Chain.' },
      { step: 'Job Matching', desc: 'Execution tasks and jobs are optimally routed and assigned to available agents.' },
      { step: 'Autonomous Action', desc: 'Agents execute the required on-chain transactions and report outcomes.' }
    ],
    accent: {
      border: 'border-[#e5e5e5] hover:border-[#fcd34d]/60 dark:border-[#262626] dark:hover:border-[#f59e0b]/40',
      bg: 'bg-[#fefce8] dark:bg-[#1a1810]',
      badge: 'bg-[#fef3c7] text-[#92400e] dark:bg-[#3b3015] dark:text-[#fcd34d]',
      glow: 'bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.06),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_50%)]',
    },
  },
  coinbase: {
    title: 'Payments (x402 & CDP)',
    description: 'Wallet-enabled and payable agents, including x402 payment requirements and Coinbase AgentKit capabilities.',
    href: '/agents?ecosystem=coinbase',
    logoSrc: '/brand-assets/coinbase-wordmark.svg',
    logoAlt: 'Coinbase',
    logoWidth: 110,
    logoHeight: 20,
    tags: ['Payments', 'Wallets', 'x402', 'AgentKit'],
    lifecycle: [
      { step: 'AgentKit Init', desc: 'Agents are equipped with programmatic crypto wallets via the CDP infrastructure.' },
      { step: 'x402 Gateway', desc: 'API endpoints enforce LSAT or x402 headers to meter and gate machine access.' },
      { step: 'Settlement', desc: 'Micro-payments stream instantly over Base to settle agent-to-agent transactions.' }
    ],
    accent: {
      border: 'border-[#e5e5e5] hover:border-[#6ee7b7]/60 dark:border-[#262626] dark:hover:border-[#10b981]/40',
      bg: 'bg-[#ecfdf5] dark:bg-[#0f1a15]',
      badge: 'bg-[#d1fae5] text-[#065f46] dark:bg-[#15352a] dark:text-[#6ee7b7]',
      glow: 'bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_50%)]',
    },
  },
}

export default function EcosystemsPageClient() {
  const [summaryItems, setSummaryItems] = useState<EcosystemSummaryItem[]>([])
  const [ecosystemAgents, setEcosystemAgents] = useState<Record<string, Agent[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const summaryResponse = await ecosystemService.getSummary()
        setSummaryItems(summaryResponse.items)

        const [virtualsRes, bnbRes, coinbaseRes] = await Promise.all([
          agentService.getAgents({
            ecosystem: 'virtuals_acp',
            page_size: 5,
            sort_field: 'created_at',
            sort_order: 'desc',
          }),
          agentService.getAgents({
            ecosystem: 'bnbagent',
            page_size: 5,
            sort_field: 'created_at',
            sort_order: 'desc',
          }),
          agentService.getAgents({
            ecosystem: 'coinbase',
            page_size: 5,
            sort_field: 'created_at',
            sort_order: 'desc',
          }),
        ])

        setEcosystemAgents({
          virtuals_acp: virtualsRes.items,
          bnbagent: bnbRes.items,
          coinbase: coinbaseRes.items,
        })
      } catch (err) {
        console.error('Failed to load ecosystem data:', err)
        setError('Failed to load real-time ecosystem data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    load()
    
    // Optional: Refresh data every 60 seconds for real-time feel
    const intervalId = setInterval(load, 60000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#e5e5e5] bg-white dark:border-[#262626] dark:bg-[#0f0f0f]">
        <div className="container mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.02),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.02),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.02),transparent_40%)] pointer-events-none" />
          
          <nav className="relative mb-6 flex items-center gap-2 text-xs text-[#737373]">
            <Link href="/" className="transition-colors hover:text-[#0a0a0a] dark:hover:text-[#fafafa]">
              Home
            </Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#d4d4d4] dark:text-[#404040]">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-medium text-[#0a0a0a] dark:text-[#fafafa]">Ecosystem Overview</span>
          </nav>

          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#fafafa] px-3 py-1 mb-4 text-[11px] font-medium text-[#525252] dark:border-[#262626] dark:bg-[#171717] dark:text-[#a3a3a3]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Real-time Live Tracker
              </div>
              <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#0a0a0a] dark:text-[#fafafa] lg:text-4xl">
                Ecosystem Data Overview
              </h1>
              <p className="text-base leading-relaxed text-[#525252] dark:text-[#a3a3a3]">
                A real-time, unified dashboard showcasing the growth and footprint of key agentic ecosystems. 
                Track new deployments and active agents across Virtuals ACP, BNB Agent, and x402 payment architectures.
              </p>
            </div>
            
            <div className="flex gap-4">
               {/* Quick aggregate metrics could go here if available, left for visual balance */}
               <div className="text-right hidden sm:block">
                 <div className="text-[11px] uppercase tracking-wider text-[#737373] mb-1">Total Signals</div>
                 <div className="text-2xl font-mono text-[#0a0a0a] dark:text-[#fafafa]">
                   {loading ? '...' : summaryItems.reduce((acc, curr) => acc + (curr.capability_count || 0), 0).toLocaleString()}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800/50 dark:bg-red-900/10 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-12">
          {Object.entries(ECOSYSTEM_CONFIG).map(([key, config]) => {
            const summary = summaryItems.find((item) => item.ecosystem === key)
            const agents = ecosystemAgents[key] || []

            return (
              <section 
                key={key} 
                className={`group relative overflow-hidden rounded-[32px] bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 dark:bg-[#121212] ${config.accent.border}`}
              >
                {/* Glow Background */}
                <div className={`pointer-events-none absolute inset-0 ${config.accent.glow} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

                <div className="relative">
                  {/* Ecosystem Header */}
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8 mb-8 border-b border-[#f0f0f0] pb-8 dark:border-[#1f1f1f]">
                    <div className="max-w-2xl">
                      <div className="mb-6 flex h-10 items-center">
                        <Image
                          src={config.logoSrc}
                          alt={config.logoAlt}
                          width={config.logoWidth}
                          height={config.logoHeight}
                          unoptimized={config.logoSrc.endsWith('.png')}
                          className="h-auto w-auto max-h-8 object-contain object-left"
                        />
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a] dark:text-[#fafafa]">
                        {config.title} Overview
                      </h2>
                      <p className="mt-3 text-[15px] leading-relaxed text-[#525252] dark:text-[#a3a3a3]">
                        {config.description}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2.5">
                        {config.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium ${config.accent.badge}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats Panel */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-4 min-w-fit">
                      <div className="flex-1 sm:flex-none rounded-2xl border border-[#f0f0f0] bg-[#fafafa] p-5 text-center transition-colors dark:border-[#1f1f1f] dark:bg-[#171717]">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373]">
                          Agents Indexed
                        </div>
                        <div className="mt-2 text-3xl font-semibold tracking-tight text-[#0a0a0a] dark:text-[#fafafa]">
                          {loading ? (
                            <div className="mx-auto h-8 w-16 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#262626]" />
                          ) : (
                            (summary?.agent_count || 0).toLocaleString()
                          )}
                        </div>
                      </div>
                      <div className="flex-1 sm:flex-none rounded-2xl border border-[#f0f0f0] bg-[#fafafa] p-5 text-center transition-colors dark:border-[#1f1f1f] dark:bg-[#171717]">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373]">
                          Detected Signals
                        </div>
                        <div className="mt-2 text-3xl font-semibold tracking-tight text-[#0a0a0a] dark:text-[#fafafa]">
                          {loading ? (
                            <div className="mx-auto h-8 w-16 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#262626]" />
                          ) : (
                            (summary?.capability_count || 0).toLocaleString()
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lifecycle Flow */}
                  <div className="mb-8 rounded-2xl bg-[#fafafa] p-5 border border-[#f0f0f0] dark:bg-[#171717] dark:border-[#1f1f1f]">
                    <div className="mb-4 flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${config.accent.badge.split(' ')[0]}`} />
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373] dark:text-[#a3a3a3]">
                        Lifecycle Flow
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {config.lifecycle.map((item, idx) => (
                        <div key={idx} className="relative flex flex-col rounded-xl border border-transparent bg-white p-4 shadow-sm dark:bg-[#121212] dark:border-[#262626]">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f0f0f0] text-[10px] font-bold text-[#0a0a0a] dark:bg-[#262626] dark:text-[#fafafa]">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                              {item.step}
                            </span>
                          </div>
                          <p className="text-[13px] leading-relaxed text-[#525252] dark:text-[#a3a3a3]">
                            {item.desc}
                          </p>
                          {/* Desktop Arrow Connection */}
                          {idx < config.lifecycle.length - 1 && (
                            <div className="absolute top-1/2 -right-[15px] z-10 hidden -translate-y-1/2 text-[#d4d4d4] md:block dark:text-[#404040]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Agents List */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a3a3a3]">
                          Latest Live Agents
                        </h3>
                      </div>
                      <Link
                        href={config.href}
                        className="group flex items-center gap-1 rounded-full bg-[#f0f0f0] px-4 py-1.5 text-xs font-medium text-[#0a0a0a] transition-all hover:bg-[#e5e5e5] dark:bg-[#262626] dark:text-[#fafafa] dark:hover:bg-[#333333]"
                      >
                        Explore all
                        <span className="transition-transform duration-200 group-hover:translate-x-0.5">&rarr;</span>
                      </Link>
                    </div>

                    <div className={AGENT_LIST_CONTAINER_CLASS}>
                      <AgentListHeader />
                      <div className="flex flex-col">
                        {loading ? (
                          <>
                            <AgentListRowSkeleton />
                            <AgentListRowSkeleton />
                            <AgentListRowSkeleton />
                          </>
                        ) : agents.length > 0 ? (
                          agents.map((agent, i) => (
                            <AgentListRow
                              key={agent.id}
                              agent={agent}
                              isLast={i === agents.length - 1}
                            />
                          ))
                        ) : (
                          <div className="py-12 text-center">
                            <div className="text-sm text-[#737373] dark:text-[#8c8c8c]">No agents found yet.</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
