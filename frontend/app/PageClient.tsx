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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(circle_at_top_left,rgba(226,232,240,0.55),transparent_42%),radial-gradient(circle_at_top_right,rgba(245,239,226,0.6),transparent_34%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.75),transparent_38%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(38,38,38,0.6),transparent_42%),radial-gradient(circle_at_top_right,rgba(28,37,30,0.45),transparent_34%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_36%)]" />
      <div className="pointer-events-none absolute left-[8%] top-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.55),transparent_70%)] opacity-60 blur-3xl animate-[pulse_11s_ease-in-out_infinite] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_70%)]" />
      <div className="pointer-events-none absolute right-[10%] top-20 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(226,232,240,0.6),transparent_70%)] opacity-50 blur-3xl animate-[pulse_13s_ease-in-out_infinite] dark:bg-[radial-gradient(circle,rgba(80,80,80,0.16),transparent_72%)]" />
      <div className="relative border-b border-[#e3e3e3] dark:border-[#2a2a2a] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(250,250,250,0.94)_100%)] dark:bg-[linear-gradient(180deg,rgba(10,10,10,0.88)_0%,rgba(13,13,13,0.96)_100%)] backdrop-blur-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="pt-7 pb-5 lg:pt-8 lg:pb-6">
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
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#737373] dark:text-[#737373]">
                Onchain Agent Index
              </div>

              <div className="max-w-[780px]">
                <div>
                  <h1 className="text-balance text-[2rem] md:text-[2.5rem] lg:text-[3rem] font-semibold leading-[1.05] text-[#0a0a0a] dark:text-[#fafafa] tracking-tight">
                    See the agent economy across blockchain networks.
                  </h1>
                </div>
              </div>

              <section className="group relative mt-4 overflow-hidden rounded-2xl border border-[#e4e4e4] dark:border-[#2b2b2b] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(250,250,250,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.86)_0%,rgba(19,19,19,0.94)_100%)] p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_12px_36px_rgba(10,10,10,0.04)] backdrop-blur-lg transition-[box-shadow,border-color] duration-300 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_16px_40px_rgba(0,0,0,0.28)] hover:shadow-[0_1px_2px_rgba(10,10,10,0.04),0_18px_44px_rgba(10,10,10,0.06)] dark:hover:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_20px_48px_rgba(0,0,0,0.32)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,rgba(255,255,255,0.5),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
                <div className="pointer-events-none absolute -right-16 top-0 h-28 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.55),transparent_68%)] opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-90 animate-[pulse_12s_ease-in-out_infinite] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_68%)]" />
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-xl">
                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
                      Search
                    </div>
                    <h2 className="mt-1 text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                      Find agents
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 lg:min-w-[560px]">
                    <Link
                      href="/agents"
                      className="inline-flex w-full items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-[#2a2a2a] bg-[linear-gradient(180deg,#141414_0%,#2a2a2a_100%)] text-white text-sm font-semibold shadow-[0_8px_20px_rgba(10,10,10,0.12)] transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-[1px] hover:border-[#111111] hover:shadow-[0_12px_28px_rgba(10,10,10,0.16)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a] dark:border-[#d0d0d0] dark:bg-[linear-gradient(180deg,#fafafa_0%,#e5e5e5_100%)] dark:text-[#0a0a0a] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)]"
                    >
                      <span>Browse Agents</span>
                    </Link>
                    <Link
                      href="/ecosystems"
                      className="inline-flex w-full items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-[#dddddd] dark:border-[#2b2b2b] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(250,250,250,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.88)_0%,rgba(18,18,18,0.94)_100%)] backdrop-blur-lg text-[#0a0a0a] dark:text-[#fafafa] text-sm font-medium transition-[transform,border-color,background-color] duration-200 hover:-translate-y-[1px] hover:border-[#cfcfcf] dark:hover:border-[#383838] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
                    >
                      <span>Open Ecosystems</span>
                    </Link>
                    <button
                      onClick={() => setMcpModalOpen(true)}
                      className="inline-flex w-full items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-[#dddddd] dark:border-[#2b2b2b] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(250,250,250,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.88)_0%,rgba(18,18,18,0.94)_100%)] backdrop-blur-lg text-[#0a0a0a] dark:text-[#fafafa] text-sm font-medium transition-[transform,border-color,background-color] duration-200 hover:-translate-y-[1px] hover:border-[#cfcfcf] dark:hover:border-[#383838] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a] sm:col-span-2 lg:col-span-1"
                    >
                      <span>Install MCP</span>
                    </button>
                  </div>
                </div>
                <div className="mt-2.5">
                  <SearchBar
                    onSearch={setSearchQuery}
                    onSubmit={(query) => {
                      const params = query ? `?search=${encodeURIComponent(query)}` : ''
                      router.push(`/agents${params}`)
                    }}
                  />
                </div>
              </section>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                {!stats ? (
                  <>
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                  </>
                ) : (
                  <>
                    <Link href="/agents" className="relative overflow-hidden rounded-2xl border border-[#e0e0e0] dark:border-[#2b2b2b] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(251,251,251,0.95)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.84)_0%,rgba(20,20,20,0.92)_100%)] px-4 py-4 text-left backdrop-blur-lg transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:border-[#d0d0d0] dark:hover:border-[#383838] hover:shadow-[0_10px_24px_rgba(10,10,10,0.05)] dark:hover:shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
                        Indexed Agents
                      </div>
                      <div className="mt-2 text-2xl md:text-3xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] tabular-nums">
                        {formatNumber(stats.total_agents)}
                      </div>
                    </Link>
                    <Link href="/agents" className="relative overflow-hidden rounded-2xl border border-[#e0e0e0] dark:border-[#2b2b2b] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(251,251,251,0.95)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.84)_0%,rgba(20,20,20,0.92)_100%)] px-4 py-4 text-left backdrop-blur-lg transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:border-[#d0d0d0] dark:hover:border-[#383838] hover:shadow-[0_10px_24px_rgba(10,10,10,0.05)] dark:hover:shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
                        Active Agents
                      </div>
                      <div className="mt-2 text-2xl md:text-3xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] tabular-nums">
                        {formatNumber(stats.active_agents)}
                      </div>
                    </Link>
                    <Link href="/networks" className="relative overflow-hidden rounded-2xl border border-[#e0e0e0] dark:border-[#2b2b2b] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(251,251,251,0.95)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.84)_0%,rgba(20,20,20,0.92)_100%)] px-4 py-4 text-left backdrop-blur-lg transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:border-[#d0d0d0] dark:hover:border-[#383838] hover:shadow-[0_10px_24px_rgba(10,10,10,0.05)] dark:hover:shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
                        Networks
                      </div>
                      <div className="mt-2 text-2xl md:text-3xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] tabular-nums">
                        {formatNumber(stats.total_networks)}
                      </div>
                    </Link>
                    <div className="relative overflow-hidden rounded-2xl border border-[#e0e0e0] dark:border-[#2b2b2b] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(251,251,251,0.95)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.84)_0%,rgba(20,20,20,0.92)_100%)] px-4 py-4 text-left shadow-[0_1px_2px_rgba(10,10,10,0.03)] backdrop-blur-lg dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
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
        <section className="relative pt-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(10,10,10,0.12),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]" />
          <TrendingSection data={trendingData} isLoading={trendingLoading} />
        </section>

        <div className="mt-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <div className="flex items-end justify-between gap-4 mb-5 border-b border-[#e5e5e5]/80 dark:border-[#262626]/90 pb-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373] mb-1">
                  Index
                </div>
                <h2 className="text-balance text-xl font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                  Recently updated agents
                </h2>
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
                <div className="overflow-hidden rounded-2xl border border-[#dfdfdf] dark:border-[#2b2b2b] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(251,251,251,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.86)_0%,rgba(18,18,18,0.94)_100%)] shadow-[0_1px_2px_rgba(10,10,10,0.04),0_18px_40px_rgba(10,10,10,0.05)] backdrop-blur-lg dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_20px_44px_rgba(0,0,0,0.24)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
                  <div className="hidden md:grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_96px_88px] gap-4 px-4 py-2.5 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(247,247,247,0.86)_100%)] dark:bg-[linear-gradient(180deg,rgba(21,21,21,0.84)_0%,rgba(18,18,18,0.9)_100%)] text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373]">
                    <div>Agent</div>
                    <div>Signals</div>
                    <div className="text-right">Trust</div>
                    <div className="text-right">Updated</div>
                  </div>
                  {agents.map((agent, index) => (
                    <Link
                      key={agent.id}
                      href={`/agents/${agent.id}`}
                      className={`block px-4 py-3.5 transition-[background-color,border-color,box-shadow] hover:bg-[rgba(250,250,250,0.95)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:hover:bg-[rgba(255,255,255,0.04)] dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${index !== agents.length - 1 ? 'border-b border-[#ebebeb] dark:border-[#2a2a2a]' : ''}`}
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
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6 lg:pl-1">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-[#e5e5e5]/80 dark:border-[#262626]/90 pb-3">
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
              <div className="overflow-hidden rounded-2xl border border-[#dfdfdf] dark:border-[#2b2b2b] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(251,251,251,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.86)_0%,rgba(18,18,18,0.94)_100%)] shadow-[0_1px_2px_rgba(10,10,10,0.04),0_14px_32px_rgba(10,10,10,0.04)] backdrop-blur-lg dark:shadow-[0_1px_2px_rgba(0,0,0,0.28),0_18px_36px_rgba(0,0,0,0.22)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
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
              <div className="mb-3 border-b border-[#e5e5e5]/80 dark:border-[#262626]/90 pb-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373] dark:text-[#737373] mb-1">
                  Analysis
                </div>
                <h2 className="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                  Registration trend
                </h2>
              </div>
              <div className="relative rounded-2xl border border-[#dfdfdf] dark:border-[#2b2b2b] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(250,250,250,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.86)_0%,rgba(18,18,18,0.94)_100%)] p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_14px_32px_rgba(10,10,10,0.04)] backdrop-blur-lg dark:shadow-[0_1px_2px_rgba(0,0,0,0.28),0_18px_36px_rgba(0,0,0,0.22)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
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
              <div className="mb-3 border-b border-[#e5e5e5]/80 dark:border-[#262626]/90 pb-3">
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
