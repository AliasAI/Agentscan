'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SearchBar } from '@/components/common/SearchBar'
import { AgentCard } from '@/components/agent/AgentCard'
import { ActivityList } from '@/components/common/ActivityList'
import { RegistrationTrendChart } from '@/components/charts/RegistrationTrendChart'
import { CategoryDistribution } from '@/components/charts/CategoryDistribution'
import { MultiNetworkSyncStatus } from '@/components/common/MultiNetworkSyncStatus'
import { formatNumber } from '@/lib/utils/format'
import { AgentCardSkeleton, StatCardSkeleton, ActivityItemSkeleton } from '@/components/common/Skeleton'
import { TrendingSection } from '@/components/home/TrendingSection'
import { statsService, agentService, activityService, taxonomyService } from '@/lib/api/services'
import type { Agent, Activity, Stats, RegistrationTrendData, CategoryDistributionData, TrendingAgentsResponse } from '@/types'

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

  // Fetch stats on mount and refresh every 10 seconds
  useEffect(() => {
    const fetchStats = () => {
      statsService.getStats()
        .then(setStats)
        .catch(console.error)
    }

    fetchStats()
    const interval = setInterval(fetchStats, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // Fetch agents (latest by default, quality filtered)
  useEffect(() => {
    setLoading(true)
    agentService
      .getAgents({
        page: 1,
        page_size: 8,
        search: searchQuery || undefined,
        quality: 'basic', // Only show agents with name + description
      })
      .then((response) => {
        setAgents(response.items)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [searchQuery])

  // Fetch activities and refresh every 10 seconds
  useEffect(() => {
    const fetchActivities = () => {
      activityService
        .getActivities({ page: 1, page_size: 10 })
        .then((response) => {
          setActivities(response.items)
        })
        .catch(console.error)
    }

    fetchActivities()
    const interval = setInterval(fetchActivities, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // Fetch registration trend data on mount only (no auto-refresh)
  useEffect(() => {
    statsService
      .getRegistrationTrend(30)
      .then((response) => {
        setTrendData(response.data)
      })
      .catch(console.error)
  }, [])

  // Fetch category distribution data on mount only
  useEffect(() => {
    taxonomyService
      .getDistribution()
      .then(setCategoryData)
      .catch(console.error)
  }, [])

  // Fetch trending agents on mount only
  useEffect(() => {
    setTrendingLoading(true)
    agentService
      .getTrendingAgents(5)
      .then(setTrendingData)
      .catch(console.error)
      .finally(() => setTrendingLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Hero Section - 黑白极简风格 */}
      <div className="relative border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center pt-10 pb-8 lg:pt-14 lg:pb-10">
            {/* Multi-Network Sync Status */}
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

            <div className="max-w-3xl mx-auto">
              {/* 标题使用纯黑 */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight text-[#0a0a0a] dark:text-[#fafafa] tracking-tight">
                ERC-8004 AI Agent Explorer
              </h1>

              <p className="text-sm md:text-base text-[#525252] dark:text-[#a3a3a3] mb-6 max-w-xl mx-auto leading-relaxed">
                Discover and track AI agents on the blockchain
              </p>

              <div className="flex justify-center mb-5">
                <div className="w-full max-w-lg">
                  <SearchBar
                    onSearch={setSearchQuery}
                    onSubmit={(query) => {
                      const params = query ? `?search=${encodeURIComponent(query)}` : ''
                      router.push(`/agents${params}`)
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {/* 主按钮：纯黑背景 */}
                <Link
                  href="/agents"
                  className="inline-flex items-center gap-1.5 h-10 px-5 bg-[#0a0a0a] hover:bg-[#262626] active:scale-[0.98] text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a]"
                >
                  <span>Browse Agents</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                {/* 次按钮：细边框风格 */}
                <Link
                  href="/networks"
                  className="inline-flex items-center gap-1.5 h-10 px-5 bg-white dark:bg-[#171717] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] active:scale-[0.98] text-[#0a0a0a] dark:text-[#fafafa] text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
                >
                  <span>Networks</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Overall Stats - OpenRouter-style borderless stats */}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 mb-10 pt-6 relative z-10">
          {!stats ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Link href="/agents" className="text-center group">
                <div className="text-2xl md:text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] group-hover:text-[#22c55e] transition-colors tabular-nums">
                  {formatNumber(stats.total_agents)}
                </div>
                <div className="text-[11px] font-medium text-[#737373] uppercase tracking-wide mt-0.5">
                  Total Agents
                </div>
              </Link>
              <Link href="/agents" className="text-center group">
                <div className="text-2xl md:text-3xl font-bold text-[#22c55e] dark:text-[#4ade80] tabular-nums">
                  {formatNumber(stats.active_agents)}
                </div>
                <div className="text-[11px] font-medium text-[#737373] uppercase tracking-wide mt-0.5">
                  Active (7d)
                </div>
              </Link>
              <Link href="/networks" className="text-center group">
                <div className="text-2xl md:text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] group-hover:text-[#3b82f6] transition-colors tabular-nums">
                  {formatNumber(stats.total_networks)}
                </div>
                <div className="text-[11px] font-medium text-[#737373] uppercase tracking-wide mt-0.5">
                  Networks
                </div>
              </Link>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] tabular-nums">
                  {formatNumber(stats.total_activities)}
                </div>
                <div className="text-[11px] font-medium text-[#737373] uppercase tracking-wide mt-0.5">
                  Activities
                </div>
              </div>
            </>
          )}
        </div>

        {/* Trending Now Section */}
        <TrendingSection data={trendingData} isLoading={trendingLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Agents with Tabs */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0a0a0a] dark:text-[#fafafa]">
                  AI Agents
                </h2>
                <p className="text-xs text-[#737373] dark:text-[#525252] mt-0.5">
                  Showing agents with complete profiles
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

            {/* Agent List */}
            <div className="mt-2">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Category Trends + Registration Trend + Recent Activity */}
          <div className="space-y-6">
            {/* Category Distribution */}
            <CategoryDistribution data={categoryData || undefined} isLoading={!categoryData} />

            {/* Registration Trend Chart */}
            <div>
              <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-3">
                Registration Trend
              </h2>
              <div className="bg-white dark:bg-[#171717] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#262626]">
                {trendData.length > 0 ? (
                  <RegistrationTrendChart data={trendData} />
                ) : (
                  <div className="h-[160px] flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#0a0a0a] dark:border-[#fafafa] border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-xs text-[#737373] dark:text-[#737373]">Loading...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                  Recent Activity
                </h2>
                {/* Live indicator */}
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
          </div>
        </div>
      </div>
    </div>
  )
}
