'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { EcosystemBadges } from '@/components/agent/EcosystemBadges'
import { ecosystemService, agentService } from '@/lib/api/services'
import type { Agent, EcosystemSummaryItem } from '@/types'

function getAcpMeta(agent: Agent) {
  const ecosystem = agent.ecosystems?.find((item) => item.name === 'virtuals_acp')
  const capability = agent.capabilities?.find((item) => item.name === 'acp')
  const payable = agent.capabilities?.find((item) => item.name === 'payable')
  const metadata = ecosystem?.metadata || {}
  const offeringsCount = Number(
    capability?.value?.offerings_count ?? metadata.offerings_count ?? 0
  )
  const resourcesCount = Number(
    capability?.value?.resources_count ?? metadata.resources_count ?? 0
  )
  const chains = (
    (metadata.chains as Array<{ chainId?: number; symbol?: string | null }> | undefined) || []
  )
  const cluster = String(capability?.value?.cluster ?? metadata.cluster ?? '').trim()
  const tag = String(capability?.value?.tag ?? metadata.tag ?? '').trim()
  return {
    offeringsCount,
    resourcesCount,
    chains,
    cluster,
    tag,
    isPayable: Boolean(payable),
  }
}

export default function VirtualsAcpPageClient() {
  const [summary, setSummary] = useState<EcosystemSummaryItem | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryResponse, agentResponse] = await Promise.all([
          ecosystemService.getSummary(),
          agentService.getAgents({
            ecosystem: 'virtuals_acp',
            quality: 'all',
            page_size: 24,
            sort_field: 'created_at',
            sort_order: 'desc',
          }),
        ])

        setSummary(
          summaryResponse.items.find((item) => item.ecosystem === 'virtuals_acp') || null
        )
        setAgents(agentResponse.items)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const spotlight = agents.slice(0, 3)
  const roster = agents.slice(0, 16)

  const metrics = useMemo(() => {
    const aggregates = agents.reduce(
      (acc, agent) => {
        const meta = getAcpMeta(agent)
        acc.offerings += meta.offeringsCount
        acc.resources += meta.resourcesCount
        if (meta.isPayable) acc.payable += 1
        for (const chain of meta.chains) {
          if (typeof chain.chainId === 'number') acc.chainIds.add(chain.chainId)
        }
        if (meta.cluster || meta.tag) acc.clusters.add(meta.cluster || meta.tag)
        return acc
      },
      {
        offerings: 0,
        resources: 0,
        payable: 0,
        chainIds: new Set<number>(),
        clusters: new Set<string>(),
      }
    )

    return {
      offerings: aggregates.offerings,
      resources: aggregates.resources,
      payable: aggregates.payable,
      chainCount: aggregates.chainIds.size,
      clusters: Array.from(aggregates.clusters).slice(0, 6),
    }
  }, [agents])

  const commerceRows = useMemo(
    () =>
      agents
        .map((agent) => {
          const meta = getAcpMeta(agent)
          return {
            agent,
            score: meta.offeringsCount * 3 + meta.resourcesCount * 2 + (meta.isPayable ? 5 : 0),
            ...meta,
          }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 8),
    [agents]
  )

  const topOfferings = useMemo(
    () =>
      agents
        .map((agent) => ({ agent, ...getAcpMeta(agent) }))
        .sort((a, b) => b.offeringsCount - a.offeringsCount)
        .slice(0, 6),
    [agents]
  )

  const payableBoard = useMemo(
    () =>
      agents
        .map((agent) => ({ agent, ...getAcpMeta(agent) }))
        .filter((item) => item.isPayable)
        .sort((a, b) => b.offeringsCount - a.offeringsCount)
        .slice(0, 6),
    [agents]
  )

  const clusterBoard = useMemo(() => {
    const clusters = new Map<string, { name: string; agents: number; offerings: number; resources: number }>()
    for (const agent of agents) {
      const meta = getAcpMeta(agent)
      const key = meta.cluster || meta.tag || 'Independent'
      const row = clusters.get(key) || { name: key, agents: 0, offerings: 0, resources: 0 }
      row.agents += 1
      row.offerings += meta.offeringsCount
      row.resources += meta.resourcesCount
      clusters.set(key, row)
    }
    return Array.from(clusters.values())
      .sort((a, b) => b.offerings - a.offerings || b.agents - a.agents)
      .slice(0, 8)
  }, [agents])

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-[#111111] dark:bg-[#0a0a0a] dark:text-[#fafafa]">
      <div className="relative overflow-hidden border-b border-[#e7e5df] dark:border-[#262626]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(23,23,23,0.10),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(64,64,64,0.12),_transparent_35%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.12),_transparent_28%)]" />
        <div className="container relative mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#6b6b68] dark:text-[#7d7d7d]">
            <Link href="/ecosystems" className="hover:text-[#111111] dark:hover:text-[#fafafa]">
              Ecosystems
            </Link>
            <span>/</span>
            <span>Virtuals ACP</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d6d3cb] bg-white/80 px-3 py-1 text-[11px] font-medium text-[#3f3f3b] backdrop-blur dark:border-[#2f2f2f] dark:bg-[#111111]/80 dark:text-[#cfcfcf]">
                <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                ACP Ecosystem
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-[#111111] dark:text-[#fafafa] sm:text-5xl">
                Virtuals ACP agents, offerings, and resource signals.
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#4f4f4a] dark:text-[#a3a3a3] sm:text-base">
                This page summarizes what the current ACP crawler can actually observe:
                discoverable agents, offering counts, resource counts, and payable markers.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/agents?ecosystem=virtuals_acp"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a2a2a] dark:bg-[#fafafa] dark:text-[#111111] dark:hover:bg-[#e6e6e6]"
                >
                  Browse all ACP agents
                </Link>
                <Link
                  href="/agents?ecosystem=virtuals_acp&capability=payable"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d6d3cb] bg-white px-4 py-2.5 text-sm font-medium text-[#111111] transition-colors hover:bg-[#f3f2ee] dark:border-[#2f2f2f] dark:bg-[#111111] dark:text-[#fafafa] dark:hover:bg-[#1b1b1b]"
                >
                  View payable agents
                </Link>
              </div>

              <div className="mt-8 grid gap-2 sm:grid-cols-4">
                <QuickChip label="Payable" value={loading ? '...' : `${metrics.payable}`} />
                <QuickChip label="Clusters" value={loading ? '...' : `${metrics.clusters.length}`} />
                <QuickChip label="Chains" value={loading ? '...' : `${metrics.chainCount}`} />
                <QuickChip label="Roster" value={loading ? '...' : `${agents.length}`} />
              </div>
            </div>

            <div className="rounded-[28px] border border-[#dad7ce] bg-[linear-gradient(180deg,#ffffff_0%,#f0ede5_100%)] p-5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.28)] dark:border-[#2a2a2a] dark:bg-[linear-gradient(180deg,#111111_0%,#171717_100%)]">
              <div className="mb-4 text-xs uppercase tracking-[0.18em] text-[#73736d] dark:text-[#737373]">
                Snapshot
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard label="Indexed agents" value={loading ? '...' : String(summary?.agent_count || 0)} />
                <MetricCard label="Capability signals" value={loading ? '...' : String(summary?.capability_count || 0)} />
                <MetricCard label="Offerings observed" value={loading ? '...' : String(metrics.offerings)} />
                <MetricCard label="Resources observed" value={loading ? '...' : String(metrics.resources)} />
              </div>
              <div className="mt-4 rounded-2xl border border-[#e7e3d9] bg-white/80 p-4 dark:border-[#242424] dark:bg-[#0d0d0d]">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#73736d] dark:text-[#6f6f6f]">
                  Why this page matters
                </div>
                <div className="mt-2 text-sm leading-6 text-[#44443f] dark:text-[#a3a3a3]">
                  ACP is the clearest current proof that an agent is not just listed, but
                  actually sellable, callable, and structured for machine-to-machine work.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <CompactTableCard
            title="Commerce ranking"
            subtitle="Fast scan of agents with the strongest visible ACP signals."
            columns={['Agent', 'Offers', 'Resources', 'Mode']}
            rows={commerceRows.map((item) => [
              <Link key={`${item.agent.id}-name`} href={`/agents/${item.agent.id}`} className="font-medium hover:underline">
                {item.agent.name}
              </Link>,
              `${item.offeringsCount}`,
              `${item.resourcesCount}`,
              item.isPayable ? 'Payable' : 'Listed',
            ])}
          />

          <CompactTableCard
            title="Cluster board"
            subtitle="Which ACP clusters currently carry the most commerce weight."
            columns={['Cluster', 'Agents', 'Offers', 'Resources']}
            rows={clusterBoard.map((item) => [
              item.name,
              `${item.agents}`,
              `${item.offerings}`,
              `${item.resources}`,
            ])}
          />
        </section>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[28px] border border-[#e4e1d8] bg-white p-6 dark:border-[#262626] dark:bg-[#121212]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em]">Capability profile</h2>
                <p className="mt-1 text-sm text-[#5d5d58] dark:text-[#8c8c8c]">
                  What this ecosystem currently contributes to the agent graph.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SignalCard title="Payable agents" value={metrics.payable} body="Agents that expose ACP offerings and can be hired through escrow." />
              <SignalCard title="Chain coverage" value={metrics.chainCount} body="Distinct chains observed from ACP search results." />
              <SignalCard title="Primary protocol" value="ACP" body="Offerings and resources are structured instead of scraped from plain profile text." />
              <SignalCard title="Discovery mode" value="Search" body="Current ingestion uses public ACP search, then normalizes to Agentscan." />
            </div>

            {metrics.clusters.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-[#73736d] dark:text-[#6f6f6f]">
                  Active clusters
                </div>
                <div className="flex flex-wrap gap-2">
                  {metrics.clusters.map((cluster) => (
                    <span
                      key={cluster}
                      className="rounded-full border border-[#ddd8cf] bg-[#f6f3ec] px-3 py-1 text-xs font-medium text-[#44443f] dark:border-[#2a2a2a] dark:bg-[#171717] dark:text-[#c5c5c5]"
                    >
                      {cluster}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-[#1d1d1d] bg-[#111111] p-6 text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.5)] dark:border-[#2b2b2b]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-white">Spotlight agents</h2>
                <p className="mt-1 text-sm text-[#aaaaaa]">
                  Recently indexed ACP agents with visible commerce signals.
                </p>
              </div>
              <Link
                href="/agents?ecosystem=virtuals_acp"
                className="text-xs uppercase tracking-[0.18em] text-[#d0d0d0] hover:text-white"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {spotlight.map((agent) => {
                const meta = getAcpMeta(agent)
                return (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="block rounded-2xl border border-[#272727] bg-[#151515] p-4 transition-colors hover:border-[#3a3a3a] hover:bg-[#1a1a1a]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-base font-medium text-white">{agent.name}</div>
                        <div className="mt-1 line-clamp-2 text-sm leading-6 text-[#a3a3a3]">
                          {agent.description}
                        </div>
                      </div>
                      <div className="rounded-full border border-[#2f2f2f] px-2.5 py-1 text-[11px] text-[#d6d6d6]">
                        {meta.offeringsCount} offers
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#8f8f8f]">
                      <span>{meta.resourcesCount} resources</span>
                      {meta.chains.length > 0 && <span>• {meta.chains.map((item) => item.chainId).filter(Boolean).join(', ')}</span>}
                      {(meta.cluster || meta.tag) && <span>• {meta.cluster || meta.tag}</span>}
                    </div>
                  </Link>
                )
              })}
              {!loading && spotlight.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#2d2d2d] p-6 text-sm text-[#8f8f8f]">
                  No ACP agents indexed yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 grid gap-4 xl:grid-cols-2">
          <CompactTableCard
            title="Top offerings"
            subtitle="Agents with the deepest commercial inventory."
            columns={['Agent', 'Offers', 'Resources', 'Cluster']}
            rows={topOfferings.map((item) => [
              <Link key={`${item.agent.id}-offerings`} href={`/agents/${item.agent.id}`} className="font-medium hover:underline">
                {item.agent.name}
              </Link>,
              `${item.offeringsCount}`,
              `${item.resourcesCount}`,
              item.cluster || item.tag || 'Independent',
            ])}
          />

          <CompactTableCard
            title="Payable board"
            subtitle="Agents immediately routeable through ACP escrow."
            columns={['Agent', 'Offers', 'Chains', 'Status']}
            rows={payableBoard.map((item) => [
              <Link key={`${item.agent.id}-payable`} href={`/agents/${item.agent.id}`} className="font-medium hover:underline">
                {item.agent.name}
              </Link>,
              `${item.offeringsCount}`,
              item.chains.map((chain) => chain.chainId).filter(Boolean).join(', ') || 'N/A',
              'Escrow',
            ])}
          />
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#fafafa]">
                ACP agent roster
              </h2>
              <p className="mt-1 text-sm text-[#5d5d58] dark:text-[#8c8c8c]">
                Dense roster view with commerce, routing, and ecosystem context.
              </p>
            </div>
            <Link
              href="/agents?ecosystem=virtuals_acp"
              className="text-sm font-medium text-[#111111] hover:text-[#4b4b46] dark:text-[#fafafa] dark:hover:text-[#d4d4d4]"
            >
              Open filtered search
            </Link>
          </div>

          <section className="overflow-hidden rounded-[28px] border border-[#e4e1d8] bg-white dark:border-[#262626] dark:bg-[#121212]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#efebe2] bg-[#faf8f2] text-left text-[11px] uppercase tracking-[0.16em] text-[#73736d] dark:border-[#202020] dark:bg-[#101010] dark:text-[#6f6f6f]">
                    <th className="px-5 py-3 font-medium">Agent</th>
                    <th className="px-5 py-3 font-medium">Signals</th>
                    <th className="px-5 py-3 font-medium">Offers</th>
                    <th className="px-5 py-3 font-medium">Resources</th>
                    <th className="px-5 py-3 font-medium">Chains</th>
                    <th className="px-5 py-3 font-medium">Route</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((agent) => {
                    const meta = getAcpMeta(agent)
                    return (
                      <tr key={agent.id} className="border-b border-[#f3f0e8] last:border-b-0 dark:border-[#1b1b1b]">
                        <td className="px-5 py-3 align-top">
                          <Link href={`/agents/${agent.id}`} className="block min-w-0">
                            <div className="truncate font-medium text-[#111111] hover:underline dark:text-[#fafafa]">{agent.name}</div>
                            <div className="mt-1 line-clamp-2 text-[12px] text-[#4f4e48] dark:text-[#9a9a9a]">{agent.description}</div>
                          </Link>
                        </td>
                        <td className="px-5 py-3 align-top">
                          <div className="space-y-2">
                            <EcosystemBadges
                              ecosystems={agent.ecosystems}
                              capabilities={agent.capabilities}
                              tokenId={agent.token_id}
                              agentWallet={agent.agent_wallet}
                              isActive={agent.is_active}
                              compact
                            />
                            <div className="text-[11px] text-[#6e6a60] dark:text-[#7b7b7b]">{meta.cluster || meta.tag || 'Independent'}</div>
                          </div>
                        </td>
                        <td className="px-5 py-3 align-top font-semibold text-[#111111] dark:text-[#fafafa]">{meta.offeringsCount}</td>
                        <td className="px-5 py-3 align-top font-semibold text-[#111111] dark:text-[#fafafa]">{meta.resourcesCount}</td>
                        <td className="px-5 py-3 align-top text-[#302f2c] dark:text-[#d0d0d0]">
                          {meta.chains.map((chain) => chain.chainId).filter(Boolean).join(', ') || 'N/A'}
                        </td>
                        <td className="px-5 py-3 align-top">
                          <div className="text-sm font-medium text-[#111111] dark:text-[#fafafa]">{meta.isPayable ? 'Escrow payable' : 'Listed only'}</div>
                          <div className="mt-1 text-[11px] text-[#6e6a60] dark:text-[#7b7b7b]">{meta.chains.length > 0 ? 'Chain-aware' : 'No chain metadata'}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </div>
  )
}

function QuickChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e6e1d6] bg-white/75 px-4 py-3 dark:border-[#242424] dark:bg-[#0d0d0d]">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#73736d] dark:text-[#6f6f6f]">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-[-0.03em]">{value}</div>
    </div>
  )
}

function CompactTableCard({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string
  subtitle: string
  columns: string[]
  rows: React.ReactNode[][]
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#e4e1d8] bg-white dark:border-[#262626] dark:bg-[#121212]">
      <div className="border-b border-[#efebe2] px-5 py-4 dark:border-[#202020]">
        <div className="text-lg font-semibold tracking-[-0.02em]">{title}</div>
        <div className="mt-1 text-sm text-[#5d5d58] dark:text-[#8c8c8c]">{subtitle}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#efebe2] bg-[#faf8f2] text-left text-[11px] uppercase tracking-[0.16em] text-[#73736d] dark:border-[#202020] dark:bg-[#101010] dark:text-[#6f6f6f]">
              {columns.map((column) => (
                <th key={column} className="px-5 py-3 font-medium">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[#f3f0e8] last:border-b-0 dark:border-[#1b1b1b]">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-5 py-3 text-[#302f2c] dark:text-[#d0d0d0]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e7e3d9] bg-white/75 p-4 dark:border-[#242424] dark:bg-[#0d0d0d]">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#73736d] dark:text-[#6f6f6f]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#111111] dark:text-[#fafafa]">
        {value}
      </div>
    </div>
  )
}

function SignalCard({
  title,
  value,
  body,
}: {
  title: string
  value: number | string
  body: string
}) {
  return (
    <div className="rounded-2xl border border-[#ebe7df] bg-[#fbfaf7] p-4 dark:border-[#242424] dark:bg-[#0d0d0d]">
      <div className="text-sm font-medium text-[#111111] dark:text-[#fafafa]">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#fafafa]">
        {value}
      </div>
      <div className="mt-2 text-sm leading-6 text-[#5d5d58] dark:text-[#8c8c8c]">{body}</div>
    </div>
  )
}
