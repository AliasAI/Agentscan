'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { NetworkSelector } from '@/components/common/NetworkSelector'
import { StatsCards, StatIcons } from '@/components/insights/StatsCards'
import { TrendCharts } from '@/components/insights/TrendCharts'
import { RecentActivity } from '@/components/insights/RecentActivity'
import { analyticsService, endpointHealthService } from '@/lib/api/services'
import type { AnalyticsResponse } from '@/types'

const AUTO_REFRESH_INTERVAL = 60000

export default function InsightsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null)
  const [quickStats, setQuickStats] = useState<Record<string, number>>({})
  const [network, setNetwork] = useState('all')
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)

      const networkParam = network !== 'all' ? network : undefined

      // Fetch both APIs concurrently
      const [analytics, endpointStats] = await Promise.all([
        analyticsService.getOverview({ days, limit: 10, network: networkParam }),
        endpointHealthService.getQuickStats(networkParam).catch(() => null),
      ])

      setAnalyticsData(analytics)

      // Extract quick stats from endpoint health quick-stats (pure SQL, fast)
      if (endpointStats?.summary) {
        setQuickStats(endpointStats.summary)
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err)
      setError('Failed to load data')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [network, days])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(false), AUTO_REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  // Build stat cards from combined data
  const statCards = analyticsData ? [
    {
      label: 'Active Agents',
      value: analyticsData.stats.active_agents,
      icon: StatIcons.activeAgents,
      color: 'green' as const,
      tooltip: 'Agents with working endpoints or reputation feedback',
      subtitle: `${analyticsData.stats.quality_rate}% of total`,
    },
    {
      label: 'Working Endpoints',
      value: analyticsData.stats.agents_with_working_endpoints,
      icon: StatIcons.workingEndpoints,
      color: 'blue' as const,
      tooltip: 'Agents with reachable HTTP endpoints',
    },
    {
      label: 'Total Feedbacks',
      value: quickStats.total_feedbacks || analyticsData.stats.agents_with_reputation,
      icon: StatIcons.totalFeedbacks,
      color: 'purple' as const,
      tooltip: 'Total on-chain feedback submissions',
    },
    {
      label: 'Avg Score',
      value: (quickStats.avg_reputation_score || 0).toFixed(1),
      icon: StatIcons.avgScore,
      color: 'orange' as const,
      tooltip: 'Average reputation score of agents with feedback',
    },
  ] : []

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-2 text-xs text-[#737373] mb-4">
            <Link href="/" className="hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors">Home</Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#d4d4d4] dark:text-[#404040]">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[#0a0a0a] dark:text-[#fafafa] font-medium">Insights</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] tracking-tight">
                Network Insights
              </h1>
              <p className="text-sm text-[#525252] dark:text-[#a3a3a3] mt-1">
                Key metrics, trends, and recent activity across the ecosystem
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Network filter */}
        <div className="mb-6">
          <NetworkSelector selectedNetwork={network} onNetworkChange={setNetwork} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && !analyticsData ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#e5e5e5] dark:border-[#404040] border-t-[#0a0a0a] dark:border-t-[#fafafa] rounded-full animate-spin" />
          </div>
        ) : analyticsData ? (
          <>
            <StatsCards cards={statCards} />

            <TrendCharts
              trendData={analyticsData.trend_data}
              networkStats={analyticsData.network_stats}
              days={days}
              onDaysChange={setDays}
            />

            <RecentActivity activities={analyticsData.recent_activities} />
          </>
        ) : null}
      </div>
    </div>
  )
}
