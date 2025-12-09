'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SearchBar } from '@/components/common/SearchBar'
import { AgentCard } from '@/components/agent/AgentCard'
import { ActivityList } from '@/components/common/ActivityList'
import { RegistrationTrendChart } from '@/components/charts/RegistrationTrendChart'
import { CategoryDistribution } from '@/components/charts/CategoryDistribution'
import { MultiNetworkSyncStatus } from '@/components/common/MultiNetworkSyncStatus'
import Tabs from '@/components/common/Tabs'
import { formatNumber } from '@/lib/utils/format'
import { AgentCardSkeleton, StatCardSkeleton, ActivityItemSkeleton } from '@/components/common/Skeleton'
import { statsService, agentService, activityService, taxonomyService } from '@/lib/api/services'
import type { Agent, Activity, Stats, RegistrationTrendData, CategoryDistributionData } from '@/types'

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [trendData, setTrendData] = useState<RegistrationTrendData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryDistributionData | null>(null)
  const [activeTab, setActiveTab] = useState('all')
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

  // Fetch agents based on tab and search
  useEffect(() => {
    setLoading(true)
    agentService
      .getAgents({
        tab: activeTab,
        page: 1,
        page_size: 8,
        search: searchQuery || undefined,
      })
      .then((response) => {
        setAgents(response.items)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeTab, searchQuery])

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

  const tabs = [
    { id: 'all', label: 'All Agents', count: stats?.total_agents },
    { id: 'active', label: 'Active', count: stats?.active_agents },
    { id: 'top', label: 'Top Rated', count: undefined },
  ]

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Hero Section - 黑白极简风格 */}
      <div className="relative overflow-hidden border-b border-[#e5e5e5] dark:border-[#262626]">
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
                  <SearchBar onSearch={setSearchQuery} />
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
        {/* Overall Stats - 黑白灰配色 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 pt-6 relative z-10">
          {!stats ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              {/* Total Agents Card */}
              <div className="group relative bg-white dark:bg-[#171717] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040] hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#f5f5f5] dark:bg-[#262626] rounded-lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#0a0a0a] dark:text-[#fafafa]">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[#737373] dark:text-[#737373] uppercase tracking-wide">Total Agents</div>
                    <div className="text-xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
                      {formatNumber(stats.total_agents)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Agents Card */}
              <div className="group relative bg-white dark:bg-[#171717] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#262626] hover:border-[#22c55e]/40 dark:hover:border-[#4ade80]/40 hover:shadow-lg hover:shadow-[#22c55e]/5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#f0fdf4] dark:bg-[#14532d]/30 rounded-lg relative">
                    {/* Subtle pulse animation */}
                    <div className="absolute inset-0 bg-[#22c55e]/20 dark:bg-[#4ade80]/20 rounded-lg animate-ping opacity-0 group-hover:opacity-75" style={{ animationDuration: '2s' }} />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#22c55e] dark:text-[#4ade80] relative z-10">
                      <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-[#737373] dark:text-[#737373] uppercase tracking-wide">Active (7d)</span>
                      {/* Info icon with tooltip trigger */}
                      <div className="relative">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-[#a3a3a3] dark:text-[#525252] cursor-help hover:text-[#22c55e] dark:hover:text-[#4ade80] transition-colors"
                        >
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {/* Tooltip */}
                        <div className="
                          absolute left-1/2 -translate-x-1/2 bottom-full mb-2
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible
                          transition-all duration-200 ease-out
                          translate-y-1 group-hover:translate-y-0
                          z-50 pointer-events-none
                        ">
                          <div className="
                            relative bg-[#0a0a0a] dark:bg-[#fafafa]
                            text-white dark:text-[#0a0a0a]
                            text-[10px] leading-relaxed
                            px-3 py-2 rounded-lg
                            shadow-xl shadow-black/10 dark:shadow-black/20
                            whitespace-nowrap
                            border border-[#262626] dark:border-[#e5e5e5]
                          ">
                            <div className="font-medium mb-0.5">Recently active agents</div>
                            <div className="text-[#a3a3a3] dark:text-[#737373]">
                              Reviewed or registered in last 7 days
                            </div>
                            {/* Arrow */}
                            <div className="
                              absolute left-1/2 -translate-x-1/2 top-full
                              w-0 h-0
                              border-l-[6px] border-l-transparent
                              border-r-[6px] border-r-transparent
                              border-t-[6px] border-t-[#0a0a0a] dark:border-t-[#fafafa]
                            " />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-[#22c55e] dark:text-[#4ade80]">
                      {formatNumber(stats.active_agents)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Networks Card */}
              <div className="group relative bg-white dark:bg-[#171717] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040] hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#f5f5f5] dark:bg-[#262626] rounded-lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#525252] dark:text-[#a3a3a3]">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[#737373] dark:text-[#737373] uppercase tracking-wide">Networks</div>
                    <div className="text-xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
                      {formatNumber(stats.total_networks)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Activities Card */}
              <div className="group relative bg-white dark:bg-[#171717] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040] hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#f5f5f5] dark:bg-[#262626] rounded-lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#525252] dark:text-[#a3a3a3]">
                      <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[#737373] dark:text-[#737373] uppercase tracking-wide">Activities</div>
                    <div className="text-xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
                      {formatNumber(stats.total_activities)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Agents with Tabs */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0a0a0a] dark:text-[#fafafa]">
                AI Agents
              </h2>
              <Link
                href="/agents"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0a0a0a] dark:text-[#fafafa] hover:text-[#525252] dark:hover:text-[#d4d4d4] bg-[#f5f5f5] dark:bg-[#262626] hover:bg-[#e5e5e5] dark:hover:bg-[#404040] rounded-md transition-all duration-200"
              >
                <span>View All</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-current">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            {/* Tabs */}
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* Agent List */}
            <div className="mt-4">
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
