'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/common/Card'
import { SearchBar } from '@/components/common/SearchBar'
import { AgentCard } from '@/components/agent/AgentCard'
import { ActivityList } from '@/components/common/ActivityList'
import { RegistrationTrendChart } from '@/components/charts/RegistrationTrendChart'
import { MultiNetworkSyncStatus } from '@/components/common/MultiNetworkSyncStatus'
import Tabs from '@/components/common/Tabs'
import { formatNumber } from '@/lib/utils/format'
import { AgentCardSkeleton, StatCardSkeleton, ActivityItemSkeleton } from '@/components/common/Skeleton'
import { statsService, agentService, activityService } from '@/lib/api/services'
import type { Agent, Activity, Stats, RegistrationTrendData } from '@/types'

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [trendData, setTrendData] = useState<RegistrationTrendData[]>([])
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

  const tabs = [
    { id: 'all', label: 'All Agents', count: stats?.total_agents },
    { id: 'active', label: 'Active', count: stats?.active_agents },
    { id: 'new', label: 'New', count: undefined },
    { id: 'top', label: 'Top Rated', count: undefined },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-cyan-500/10 dark:from-indigo-500/5 dark:via-purple-500/5 dark:to-cyan-500/5"></div>

        {/* Animated Gradient Blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center pt-16 pb-12 lg:pt-20 lg:pb-16">
            {/* Multi-Network Sync Status - Desktop: Absolute Position Top Right, Mobile: Above Title */}
            {stats?.multi_network_sync && (
              <>
                {/* Desktop */}
                <div className="hidden md:block absolute top-4 right-8">
                  <MultiNetworkSyncStatus syncStatus={stats.multi_network_sync} />
                </div>

                {/* Mobile */}
                <div className="flex md:hidden justify-center mb-6">
                  <MultiNetworkSyncStatus syncStatus={stats.multi_network_sync} />
                </div>
              </>
            )}

            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Explore the ERC-8004
                </span>
                <br />
                <span className="text-gray-900 dark:text-gray-100">AI Agent Protocol</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
                Discover, track, and analyze intelligent agents on the blockchain. Enter the new era of decentralized AI.
              </p>

              <div className="flex justify-center mb-8">
                <div className="w-full max-w-2xl">
                  <SearchBar onSearch={setSearchQuery} />
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/agents"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                >
                  <span>Browse All Agents</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                <Link
                  href="/networks"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm transition-all hover:shadow-md"
                >
                  <span>View Networks</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12 -mt-8 relative z-10">
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
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Agents</div>
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 rounded-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-indigo-600 dark:text-indigo-400">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                    {formatNumber(stats.total_agents)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ↑ Active
                  </div>
                </div>
              </div>

              {/* Active Agents Card */}
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-green-500/10 dark:hover:shadow-green-500/20 transition-all hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Agents</div>
                    <div className="p-2 bg-green-100 dark:bg-green-950/50 rounded-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-600 dark:text-green-400">
                        <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {formatNumber(stats.active_agents)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Last 7 days
                  </div>
                </div>
              </div>

              {/* Networks Card */}
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/20 transition-all hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 dark:from-cyan-500/10 dark:to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Networks</div>
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-950/50 rounded-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-cyan-600 dark:text-cyan-400">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                    {formatNumber(stats.total_networks)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Supported chains
                  </div>
                </div>
              </div>

              {/* Total Activities Card */}
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-500/20 transition-all hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Activities</div>
                    <div className="p-2 bg-purple-100 dark:bg-purple-950/50 rounded-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-600 dark:text-purple-400">
                        <path d="M14.7 6.3C15.0391 6.69356 15.4285 7.01834 15.8513 7.26448C16.2742 7.51062 16.7233 7.67463 17.1818 7.74996C17.6404 7.82529 18.1001 7.81091 18.5542 7.70755C19.0082 7.60419 19.4491 7.41371 19.86 7.145L21 6.415V11C21 12.5913 20.3679 14.1174 19.2426 15.2426C18.1174 16.3679 16.5913 17 15 17H14.001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9.3 17.7C8.96091 17.3064 8.57147 16.9817 8.14864 16.7355C7.7258 16.4894 7.27667 16.3254 6.81816 16.25C6.35964 16.1747 5.89992 16.1891 5.44578 16.2925C4.99165 16.3958 4.55089 16.5863 4.14 16.855L3 17.585V13C3 11.4087 3.63214 9.88258 4.75736 8.75736C5.88258 7.63214 7.4087 7 9 7H10.001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                    {formatNumber(stats.total_activities)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    On-chain events
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Agents with Tabs */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                AI Agents
              </h2>
              <Link
                href="/agents"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
              >
                <span>View All</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-current">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            {/* Tabs */}
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* Agent List */}
            <div className="mt-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <AgentCardSkeleton key={i} />
                  ))}
                </div>
              ) : agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-400 dark:text-gray-500">
                      <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No agents found</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Registration Trend + Recent Activity */}
          <div className="space-y-8">
            {/* Registration Trend Chart */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Registration Trend
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-200/50 dark:border-gray-700/50">
                {trendData.length > 0 ? (
                  <RegistrationTrendChart data={trendData} />
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading trend data...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Recent Activity
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                {activities.length === 0 ? (
                  loading ? (
                    <div className="p-6 space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <ActivityItemSkeleton key={i} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gray-400 dark:text-gray-500">
                          <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-base font-medium text-gray-900 dark:text-white mb-1">No activity yet</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity to show</p>
                    </div>
                  )
                ) : (
                  <div className="p-6">
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
