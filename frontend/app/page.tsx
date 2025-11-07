'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/common/Card'
import { SearchBar } from '@/components/common/SearchBar'
import { AgentCard } from '@/components/agent/AgentCard'
import { ActivityList } from '@/components/common/ActivityList'
import { RegistrationTrendChart } from '@/components/charts/RegistrationTrendChart'
import Tabs from '@/components/common/Tabs'
import { formatNumber } from '@/lib/utils/format'
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

  // Fetch stats on mount and refresh every 5 seconds
  useEffect(() => {
    const fetchStats = () => {
      statsService.getStats()
        .then(setStats)
        .catch(console.error)
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000) // Refresh every 5 seconds

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

  // Fetch activities
  useEffect(() => {
    activityService
      .getActivities({ page: 1, page_size: 10 })
      .then((response) => {
        setActivities(response.items)
      })
      .catch(console.error)
  }, [])

  // Fetch registration trend data
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
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative text-center mb-12">
        {/* Blockchain Sync Status - Absolute Position Top Right */}
        {stats?.blockchain_sync && (
          <div className="absolute top-0 right-0 flex items-center gap-2 text-sm text-foreground/60">
            <div className="flex items-center gap-1.5">
              {stats.blockchain_sync.is_syncing ? (
                <>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Syncing</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Synced</span>
                </>
              )}
            </div>
            <span className="text-foreground/40">
              {stats.blockchain_sync.sync_progress.toFixed(1)}%
            </span>
            <span className="text-foreground/30 text-xs">
              Block {formatNumber(stats.blockchain_sync.current_block)}
            </span>
          </div>
        )}

        <h1 className="text-4xl font-bold mb-4">
          Explore AI Agents on the ERC-8004 Protocol
        </h1>
        <p className="text-lg text-foreground/60 mb-8">
          Discover, track, and analyze intelligent agents on the blockchain
        </p>
        <div className="flex justify-center">
          <SearchBar onSearch={setSearchQuery} />
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card>
          <div className="text-sm text-foreground/60 mb-2">Total Agents</div>
          <div className="text-3xl font-bold">
            {stats ? formatNumber(stats.total_agents) : '-'}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-foreground/60 mb-2">Active Agents</div>
          <div className="text-3xl font-bold text-green-600">
            {stats ? formatNumber(stats.active_agents) : '-'}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-foreground/60 mb-2">Networks</div>
          <div className="text-3xl font-bold">
            {stats ? formatNumber(stats.total_networks) : '-'}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-foreground/60 mb-2">Total Activities</div>
          <div className="text-3xl font-bold">
            {stats ? formatNumber(stats.total_activities) : '-'}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Featured Agents with Tabs */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Agents</h2>
            <Link href="/agents" className="text-blue-600 hover:underline">
              View all →
            </Link>
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} defaultTab="all" onChange={setActiveTab} />

          {/* Agent List */}
          <div className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-foreground/60">
                Loading agents...
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-12 text-foreground/60">
                No agents found
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
        <div className="space-y-6">
          {/* Registration Trend Chart */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Registration Trend</h2>
            <Card>
              {trendData.length > 0 ? (
                <RegistrationTrendChart data={trendData} />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-foreground/60">
                  Loading trend data...
                </div>
              )}
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <Card>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-foreground/60">
                  No recent activity
                </div>
              ) : (
                <ActivityList activities={activities} />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
