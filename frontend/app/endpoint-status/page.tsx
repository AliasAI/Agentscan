'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { NetworkSelector } from '@/components/common/NetworkSelector'
import type { AgentEndpointReport, EndpointSummary, ReputationAgent } from '@/types'

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const AUTO_REFRESH_INTERVAL = 60000 // 60 seconds - refresh stats from database

export default function EndpointStatusPage() {
  const [summary, setSummary] = useState<EndpointSummary | null>(null)
  const [workingAgents, setWorkingAgents] = useState<AgentEndpointReport[]>([])
  const [topReputationAgents, setTopReputationAgents] = useState<ReputationAgent[]>([])
  const [selectedNetwork, setSelectedNetwork] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'endpoints' | 'reputation'>('endpoints')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [lastScanTime, setLastScanTime] = useState<string | null>(null)

  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch quick stats (fast, from database)
  const fetchQuickStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)
      const network = selectedNetwork !== 'all' ? selectedNetwork : undefined
      const query = network ? `?network=${network}` : ''
      const response = await fetch(`${API_BASE_URL}/endpoint-health/quick-stats${query}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()

      setSummary({
        total_agents: data.summary.total_agents,
        agents_with_endpoints: data.summary.agents_scanned,
        agents_with_working_endpoints: data.summary.agents_with_working_endpoints,
        agents_with_feedbacks: data.summary.agents_with_feedbacks,
        total_endpoints: data.summary.total_endpoints,
        healthy_endpoints: data.summary.healthy_endpoints,
        endpoint_health_rate: data.summary.endpoint_health_rate,
        total_feedbacks: data.summary.total_feedbacks,
        avg_reputation_score: data.summary.avg_reputation_score,
      })

      // Show working agents from database
      setWorkingAgents(data.working_agents.map((a: any) => ({
        ...a,
        recent_feedbacks: [],
      })))

      // Set top reputation agents
      setTopReputationAgents(data.top_reputation_agents || [])

      // Update last updated time
      setLastUpdated(new Date())

      // Get last scan time from the first working agent's checked_at
      if (data.working_agents && data.working_agents.length > 0) {
        const checkedAt = data.working_agents[0]?.checked_at
        if (checkedAt) {
          setLastScanTime(checkedAt)
        }
      }
    } catch (err) {
      console.error('Failed to fetch quick stats:', err)
      setError('Failed to load data')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [selectedNetwork])

  // Initialize page - only fetch cached data from database
  useEffect(() => {
    fetchQuickStats()

    // Set up auto-refresh interval (reads from database, no scanning)
    autoRefreshRef.current = setInterval(() => {
      fetchQuickStats(false)
    }, AUTO_REFRESH_INTERVAL)

    // Cleanup
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh when network changes
  useEffect(() => {
    fetchQuickStats()
  }, [selectedNetwork]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNetworkChange = (networkId: string) => {
    setSelectedNetwork(networkId)
  }

  // Format scan time (from ISO string)
  const formatScanTime = (isoString: string | null) => {
    if (!isoString) return 'Never'
    const date = new Date(isoString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 172800) return 'Yesterday'
    return date.toLocaleDateString()
  }

  // Format response time
  const formatResponseTime = (ms?: number | null) => {
    if (ms === null || ms === undefined) return '-'
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Format relative time (e.g., "2 minutes ago")
  const formatRelativeTime = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 10) return 'Just now'
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Page Header */}
      <div className="relative border-b border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.03] dark:opacity-[0.02]"
            style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#737373] mb-4">
            <Link href="/" className="hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors">
              Home
            </Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#d4d4d4] dark:text-[#404040]">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[#0a0a0a] dark:text-[#fafafa] font-medium">Endpoint Status</span>
          </nav>

          {/* Title */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-2 tracking-tight">
                Endpoint Health Monitor
              </h1>
              <p className="text-sm text-[#525252] dark:text-[#a3a3a3] max-w-xl">
                Real-time monitoring of agent endpoint availability with automatic background sync
              </p>
            </div>

            {/* Status and Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-[#737373]">
                  Last scan: {formatScanTime(lastScanTime)} • Data: {formatRelativeTime(lastUpdated)}
                </span>
              </div>

            </div>
          </div>

          {/* Network filter */}
          <NetworkSelector
            selectedNetwork={selectedNetwork}
            onNetworkChange={handleNetworkChange}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}


        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <StatCard
              label="Total Agents"
              value={summary.total_agents}
              tooltip="Total number of AI agents registered on-chain via ERC-8004 protocol"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <StatCard
              label="Scanned"
              value={summary.agents_with_endpoints}
              tooltip="Agents that have been scanned for endpoint availability"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                  <path d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6898C16.4231 14.4392 17.0331 14.0471 17.54 13.54L20.54 10.54C21.4508 9.59699 21.9548 8.33398 21.9434 7.02298C21.932 5.71198 21.4061 4.45794 20.4791 3.53094C19.5521 2.60394 18.2981 2.07802 16.9871 2.06663C15.6761 2.05523 14.4131 2.55918 13.47 3.46998L11.75 5.17998" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60707C11.7643 9.26331 11.0685 9.05889 10.3533 9.00768C9.63816 8.95648 8.92037 9.05963 8.24861 9.31023C7.57685 9.56082 6.96684 9.95294 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04522 15.666 2.05662 16.977C2.06801 18.288 2.59394 19.542 3.52094 20.469C4.44794 21.396 5.70197 21.922 7.01297 21.9334C8.32398 21.9448 9.58699 21.4408 10.53 20.53L12.24 18.82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <StatCard
              label="Working"
              value={summary.agents_with_working_endpoints}
              tooltip="Agents with at least one reachable endpoint (HTTP 2xx response)"
              color="green"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-500">
                  <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <StatCard
              label="With Feedbacks"
              value={summary.agents_with_feedbacks}
              tooltip="Agents that have received at least one on-chain reputation feedback"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-500">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <StatCard
              label="Total Endpoints"
              value={summary.total_endpoints}
              tooltip="Sum of all endpoint URLs defined in agent metadata (from scanned agents)"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
                  <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <StatCard
              label="Health Rate"
              value={`${summary.endpoint_health_rate}%`}
              tooltip="Percentage of endpoints returning successful HTTP responses (healthy / total)"
              color={summary.endpoint_health_rate >= 50 ? 'green' : 'red'}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={summary.endpoint_health_rate >= 50 ? 'text-green-500' : 'text-red-500'}>
                  <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
          </div>
        )}

        {/* Reputation Stats Row */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Total Feedbacks"
              value={summary.total_feedbacks || 0}
              tooltip="Total number of on-chain reputation feedbacks submitted across all agents"
              color="purple"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-500">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <StatCard
              label="Avg Score"
              value={summary.avg_reputation_score || 0}
              tooltip="Average reputation score (0-100) across agents with feedbacks"
              color={summary.avg_reputation_score && summary.avg_reputation_score >= 70 ? 'green' : 'red'}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={summary.avg_reputation_score && summary.avg_reputation_score >= 70 ? 'text-green-500' : 'text-orange-500'}>
                  <path d="M12 20V10M18 20V4M6 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <StatCard
              label="Active Rate"
              value={`${summary.total_agents > 0 ? ((summary.agents_with_feedbacks / summary.total_agents) * 100).toFixed(1) : 0}%`}
              tooltip="Percentage of agents that have received at least one feedback"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                  <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-[#e5e5e5] dark:border-[#262626]">
            <button
              onClick={() => setActiveTab('endpoints')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'endpoints'
                  ? 'border-[#0a0a0a] dark:border-[#fafafa] text-[#0a0a0a] dark:text-[#fafafa]'
                  : 'border-transparent text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6898C16.4231 14.4392 17.0331 14.0471 17.54 13.54L20.54 10.54C21.4508 9.59699 21.9548 8.33398 21.9434 7.02298C21.932 5.71198 21.4061 4.45794 20.4791 3.53094C19.5521 2.60394 18.2981 2.07802 16.9871 2.06663C15.6761 2.05523 14.4131 2.55918 13.47 3.46998L11.75 5.17998" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60707C11.7643 9.26331 11.0685 9.05889 10.3533 9.00768C9.63816 8.95648 8.92037 9.05963 8.24861 9.31023C7.57685 9.56082 6.96684 9.95294 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04522 15.666 2.05662 16.977C2.06801 18.288 2.59394 19.542 3.52094 20.469C4.44794 21.396 5.70197 21.922 7.01297 21.9334C8.32398 21.9448 9.58699 21.4408 10.53 20.53L12.24 18.82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Working Endpoints ({workingAgents.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reputation')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'reputation'
                  ? 'border-[#0a0a0a] dark:border-[#fafafa] text-[#0a0a0a] dark:text-[#fafafa]'
                  : 'border-transparent text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Top Reputation ({topReputationAgents.length})
              </span>
            </button>
        </div>

        {/* Working Agents List (Endpoints Tab) */}
        {activeTab === 'endpoints' && workingAgents.length > 0 && (
          <div>
            <div className="space-y-4">
              {workingAgents.map((report) => (
                <AgentReportCard key={report.agent_id} report={report} formatResponseTime={formatResponseTime} />
              ))}
            </div>
          </div>
        )}

        {/* Top Reputation Agents (Reputation Tab) */}
        {activeTab === 'reputation' && topReputationAgents.length > 0 && (
          <div>
            <div className="space-y-3">
              {topReputationAgents.map((agent, index) => (
                <div
                  key={agent.agent_id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626]"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-[#f5f5f5] dark:bg-[#262626] text-[#737373]'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <Link
                        href={`/agents/${agent.agent_id}`}
                        className="font-medium text-[#0a0a0a] dark:text-[#fafafa] hover:underline"
                      >
                        {agent.agent_name || 'Unknown Agent'}
                      </Link>
                      <p className="text-xs text-[#737373]">
                        Token #{agent.token_id} on {agent.network_key}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {/* Endpoint status */}
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${agent.has_working_endpoints ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-xs text-[#737373]">
                        {agent.has_working_endpoints ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    {/* Feedback count */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {agent.reputation_count}
                      </p>
                      <p className="text-xs text-[#737373]">feedbacks</p>
                    </div>
                    {/* Score */}
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      agent.reputation_score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      agent.reputation_score >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {agent.reputation_score.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Endpoints Tab */}
        {!loading && activeTab === 'endpoints' && workingAgents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-[#f5f5f5] dark:bg-[#171717] rounded-2xl flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3]">
                <path d="M12 2V6M12 18V22M6 12H2M22 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">
              No working endpoints found
            </h3>
            <p className="text-sm text-[#737373] text-center max-w-md">
              Endpoint health scans run automatically every day at 03:00 UTC.
              No reachable endpoints have been found yet.
            </p>
          </div>
        )}

        {/* Empty State for Reputation Tab */}
        {!loading && activeTab === 'reputation' && topReputationAgents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-[#f5f5f5] dark:bg-[#171717] rounded-2xl flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3]">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">
              No reputation data yet
            </h3>
            <p className="text-sm text-[#737373] text-center max-w-md">
              Agents will appear here once they receive feedback from users
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#e5e5e5] dark:border-[#404040] border-t-[#0a0a0a] dark:border-t-[#fafafa] rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component with Tooltip
function StatCard({
  label,
  value,
  icon,
  color,
  tooltip,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  color?: 'green' | 'red' | 'purple'
  tooltip?: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="p-4 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] relative">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-[#737373] uppercase tracking-wider flex-1">{label}</span>
        {tooltip && (
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[#a3a3a3] hover:text-[#737373] cursor-help transition-colors"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {showTooltip && (
              <div className="absolute z-50 bottom-full right-0 mb-2 px-3 py-2 bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] text-xs rounded-lg shadow-lg w-56">
                <div className="leading-relaxed">{tooltip}</div>
                <div className="absolute top-full right-2 border-4 border-transparent border-t-[#0a0a0a] dark:border-t-[#fafafa]" />
              </div>
            )}
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${
        color === 'green' ? 'text-green-600 dark:text-green-400' :
        color === 'red' ? 'text-red-600 dark:text-red-400' :
        color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
        'text-[#0a0a0a] dark:text-[#fafafa]'
      }`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}

// Agent Report Card Component
function AgentReportCard({
  report,
  formatResponseTime,
}: {
  report: AgentEndpointReport
  formatResponseTime: (ms?: number | null) => string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#1f1f1f] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${report.has_working_endpoints ? 'bg-green-500' : 'bg-red-500'}`} />
            <div>
              <Link
                href={`/agents/${report.agent_id}`}
                className="font-medium text-[#0a0a0a] dark:text-[#fafafa] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {report.agent_name}
              </Link>
              <p className="text-xs text-[#737373]">
                Token #{report.token_id} on {report.network_key}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa]">
                {report.healthy_endpoints}/{report.total_endpoints} endpoints
              </p>
              <p className="text-xs text-[#737373]">
                {report.reputation_count} feedbacks | Score: {report.reputation_score.toFixed(1)}
              </p>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className={`text-[#737373] transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-[#e5e5e5] dark:border-[#262626]">
          {/* Endpoints */}
          {report.endpoints.length > 0 && (
            <div className="p-4">
              <h4 className="text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">
                Endpoints
              </h4>
              <div className="space-y-2">
                {report.endpoints.map((endpoint, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${endpoint.is_healthy ? 'bg-green-500' : 'bg-red-500'}`} />
                      <code className="text-xs text-[#525252] dark:text-[#a3a3a3] truncate">
                        {endpoint.url}
                      </code>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                      {endpoint.status_code && (
                        <span className={`text-xs font-mono ${
                          endpoint.status_code < 400 ? 'text-green-600' :
                          endpoint.status_code < 500 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {endpoint.status_code}
                        </span>
                      )}
                      <span className="text-xs text-[#737373]">
                        {formatResponseTime(endpoint.response_time_ms)}
                      </span>
                      {endpoint.error && (
                        <span className="text-xs text-red-500 max-w-32 truncate" title={endpoint.error}>
                          {endpoint.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Feedbacks */}
          {report.recent_feedbacks.length > 0 && (
            <div className="p-4 border-t border-[#e5e5e5] dark:border-[#262626]">
              <h4 className="text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">
                Recent Feedbacks
              </h4>
              <div className="space-y-2">
                {report.recent_feedbacks.slice(0, 5).map((feedback, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        feedback.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        feedback.score >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {feedback.score}
                      </div>
                      <span className="text-xs text-[#737373] font-mono">
                        {feedback.client_address?.slice(0, 6)}...{feedback.client_address?.slice(-4)}
                      </span>
                    </div>
                    <span className="text-xs text-[#737373]">
                      {feedback.timestamp ? new Date(Number(feedback.timestamp) * 1000).toLocaleDateString() : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
