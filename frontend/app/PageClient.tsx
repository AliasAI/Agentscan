'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SearchBar } from '@/components/common/SearchBar'
import { EcosystemBadges } from '@/components/agent/EcosystemBadges'
import { ActivityList } from '@/components/common/ActivityList'
import { RegistrationTrendChart } from '@/components/charts/RegistrationTrendChart'
import { CategoryDistribution } from '@/components/charts/CategoryDistribution'
import { MultiNetworkSyncStatus } from '@/components/common/MultiNetworkSyncStatus'
import { NetworkIcon } from '@/components/common/NetworkIcons'
import { formatAddress, formatNumber, formatTimeAgo, formatReputationScore } from '@/lib/utils/format'
import { AgentCardSkeleton, StatCardSkeleton, ActivityItemSkeleton } from '@/components/common/Skeleton'
import { TrendingSection } from '@/components/home/TrendingSection'
import { McpInstallModal } from '@/components/home/McpInstallModal'
import { statsService, agentService, activityService, taxonomyService } from '@/lib/api/services'
import type {
  Agent,
  Activity,
  Stats,
  RegistrationTrendData,
  CategoryDistributionData,
  TrendingAgentsResponse,
} from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [trendData, setTrendData] = useState<RegistrationTrendData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryDistributionData | null>(null)
  const [trendingData, setTrendingData] = useState<TrendingAgentsResponse | null>(null)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [mcpModalOpen, setMcpModalOpen] = useState(false)

  useEffect(() => {
    const fetchStats = () => {
      statsService.getStats().then(setStats).catch(console.error)
    }

    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setLoading(true)
    agentService
      .getAgents({
        page: 1,
        page_size: 8,
        search: searchQuery || undefined,
        quality: 'basic',
      })
      .then((response) => setAgents(response.items))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [searchQuery])

  useEffect(() => {
    const fetchActivities = () => {
      activityService
        .getActivities({ page: 1, page_size: 10 })
        .then((response) => setActivities(response.items))
        .catch(console.error)
    }

    fetchActivities()
    const interval = setInterval(fetchActivities, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    statsService.getRegistrationTrend(30).then((response) => setTrendData(response.data)).catch(console.error)
  }, [])

  useEffect(() => {
    taxonomyService.getDistribution().then(setCategoryData).catch(console.error)
  }, [])

  useEffect(() => {
    setTrendingLoading(true)
    agentService.getTrendingAgents(5).then(setTrendingData).catch(console.error).finally(() => setTrendingLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="relative border-b border-[#e5e5e5] dark:border-[#262626] bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#0d0d0d_100%)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="pt-8 pb-6 lg:pt-10 lg:pb-8">
            {stats?.multi_network_sync && (
              <>
                <div className="hidden md:block absolute top-4 right-6">
                  <MultiNetworkSyncStatus syncStatus={stats.multi_network_sync} />
                </div>
                <div className="flex md:hidden justify-center mb-4">
                  <MultiNetworkSyncStatus syncStatus={stats.multi_network_sync} />
                </div>
              </>
            )}

            <div className="max-w-5xl mx-auto">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[#737373] dark:text-[#737373]">
                Onchain Agent Index
              </div>

              <div className="max-w-3xl">
                <div>
                  <h1 className="text-balance text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-[#0a0a0a] dark:text-[#fafafa] tracking-tight">
                    See the agent economy across blockchain networks.
                  </h1>
                </div>
              </div>

              <section className="mt-5 rounded-2xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-xl">
                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
                      Search
                    </div>
                    <h2 className="mt-1 text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                      Search the index
                    </h2>
                    <p className="mt-1 text-sm text-[#525252] dark:text-[#a3a3a3] leading-relaxed">
                      Find agents by name, wallet, or known identifiers, then jump straight into the full index.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 lg:min-w-[560px]">
                    <Link
                      href="/agents"
                      className="inline-flex w-full items-center justify-center gap-1.5 h-10 px-4 bg-[#0a0a0a] hover:bg-[#262626] active:scale-[0.98] text-white text-sm font-semibold rounded-lg transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a]"
                    >
                      <span>Browse Agents</span>
                    </Link>
                    <Link
                      href="/ecosystems"
                      className="inline-flex w-full items-center justify-center gap-1.5 h-10 px-4 bg-white dark:bg-[#171717] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] text-[#0a0a0a] dark:text-[#fafafa] text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
                    >
                      <span>Open Ecosystems</span>
                    </Link>
                    <button
                      onClick={() => setMcpModalOpen(true)}
                      className="inline-flex w-full items-center justify-center gap-1.5 h-10 px-4 bg-white dark:bg-[#171717] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] text-[#0a0a0a] dark:text-[#fafafa] text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a] sm:col-span-2 lg:col-span-1"
                    >
                      <span>Install MCP</span>
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <SearchBar
                    onSearch={setSearchQuery}
                    onSubmit={(query) => {
                      const params = query ? `?search=${encodeURIComponent(query)}` : ''
                      router.push(`/agents${params}`)
                    }}
                  />
                </div>
              </section>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                {!stats ? (
                  <>
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                  </>
                ) : (
                  <>
                    <Link href="/agents" className="rounded-2xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 py-4 text-left transition-colors hover:border-[#d4d4d4] dark:hover:border-[#404040]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
                        Indexed Agents
                      </div>
                      <div className="mt-2 text-2xl md:text-3xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] tabular-nums">
                        {formatNumber(stats.total_agents)}
                      </div>
                    </Link>
                    <Link href="/agents" className="rounded-2xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 py-4 text-left transition-colors hover:border-[#d4d4d4] dark:hover:border-[#404040]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
                        Active Agents
                      </div>
                      <div className="mt-2 text-2xl md:text-3xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] tabular-nums">
                        {formatNumber(stats.active_agents)}
                      </div>
                    </Link>
                    <Link href="/networks" className="rounded-2xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 py-4 text-left transition-colors hover:border-[#d4d4d4] dark:hover:border-[#404040]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
                        Networks
                      </div>
                      <div className="mt-2 text-2xl md:text-3xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] tabular-nums">
                        {formatNumber(stats.total_networks)}
                      </div>
                    </Link>
                    <div className="rounded-2xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 py-4 text-left">
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
                        Activities
                      </div>
                      <div className="mt-2 text-2xl md:text-3xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] tabular-nums">
                        {formatNumber(stats.total_activities)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <section className="pt-6">
          <TrendingSection data={trendingData} isLoading={trendingLoading} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373] mb-1">
                  Index
                </div>
                <h2 className="text-balance text-xl font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                  Recently updated agents
                </h2>
                <p className="text-sm text-[#525252] dark:text-[#a3a3a3] mt-2">
                  Use this list to inspect identity, signals, trust, and freshness at a glance.
                </p>
              </div>
              <Link
                href="/agents"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#525252] dark:text-[#a3a3a3] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors"
              >
                <span>View all</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            <div className="mt-2">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <AgentCardSkeleton key={i} />
                  ))}
                </div>
              ) : agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626]">
                  <div className="w-12 h-12 bg-[#f5f5f5] dark:bg-[#262626] rounded-full flex items-center justify-center mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3] dark:text-[#525252]">
                      <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-0.5">No agents found</p>
                  <p className="text-xs text-[#737373] dark:text-[#737373]">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
                  <div className="hidden md:grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_110px_96px] gap-4 px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626] bg-[#fcfcfc] dark:bg-[#121212] text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
                    <div>Agent</div>
                    <div>Signals</div>
                    <div className="text-right">Trust</div>
                    <div className="text-right">Updated</div>
                  </div>
                  {agents.map((agent, index) => (
                    <Link
                      key={agent.id}
                      href={`/agents/${agent.id}`}
                      className={`block px-4 py-4 transition-colors hover:bg-[#fafafa] dark:hover:bg-[#111111] ${index !== agents.length - 1 ? 'border-b border-[#e5e5e5] dark:border-[#262626]' : ''}`}
                    >
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_110px_96px]">
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

                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#525252] dark:text-[#a3a3a3]">
                            {agent.description}
                          </p>
                        </div>

                        <div className="min-w-0">
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
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373] mb-1">
                    Live Feed
                  </div>
                  <h2 className="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                    Recent activity
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-[#a3a3a3] dark:text-[#525252] uppercase tracking-wide">Live</span>
                </div>
              </div>
              <div className="bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
                {activities.length === 0 ? (
                  loading ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <ActivityItemSkeleton key={i} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <div className="w-10 h-10 bg-[#f5f5f5] dark:bg-[#262626] rounded-full flex items-center justify-center mb-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3] dark:text-[#525252]">
                          <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-[#0a0a0a] dark:text-[#fafafa]">No activity yet</p>
                    </div>
                  )
                ) : (
                  <div className="p-3">
                    <ActivityList activities={activities} />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373] mb-1">
                  Analysis
                </div>
                <h2 className="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                  Registration trend
                </h2>
              </div>
              <div className="bg-white dark:bg-[#171717] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#262626]">
                {trendData.length > 0 ? (
                  <RegistrationTrendChart data={trendData} />
                ) : (
                  <div className="h-[160px] flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#0a0a0a] dark:border-[#fafafa] border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-xs text-[#737373] dark:text-[#737373]">Loading…</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373] mb-1">
                  Analysis
                </div>
                <h2 className="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                  Capability distribution
                </h2>
              </div>
              <CategoryDistribution data={categoryData || undefined} isLoading={!categoryData} />
            </div>
          </aside>
        </div>
      </div>

      <McpInstallModal open={mcpModalOpen} onClose={() => setMcpModalOpen(false)} />
    </div>
  )
}
