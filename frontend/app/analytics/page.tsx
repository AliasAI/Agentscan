'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { NetworkSelector } from '@/components/common/NetworkSelector'
import type { AnalyticsResponse, AgentTxRanking, TxTrendData, NetworkTxStats } from '@/types'
import { analyticsService } from '@/lib/api/services'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Configuration
const AUTO_REFRESH_INTERVAL = 60000 // 60 seconds
const CHART_COLORS = {
  registered: '#3b82f6', // blue
  reputation_update: '#8b5cf6', // purple
  validation_complete: '#10b981', // green
  total: '#0a0a0a', // black
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState('all')
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch analytics data
  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)

      const response = await analyticsService.getOverview({
        days,
        limit: 10,
        network: selectedNetwork !== 'all' ? selectedNetwork : undefined,
      })

      setData(response)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError('Failed to load analytics data')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [selectedNetwork, days])

  // Initialize and auto-refresh
  useEffect(() => {
    fetchData()

    const interval = setInterval(() => {
      fetchData(false)
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchData])

  // Format relative time
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

  // Prepare pie chart data
  const pieData = data?.stats.transactions_by_type
    ? Object.entries(data.stats.transactions_by_type).map(([name, value]) => ({
        name: name.replace(/_/g, ' '),
        value,
      }))
    : []

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Page Header */}
      <div className="relative border-b border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.03] dark:opacity-[0.02]"
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
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
            <span className="text-[#0a0a0a] dark:text-[#fafafa] font-medium">Analytics</span>
          </nav>

          {/* Title */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-2 tracking-tight">
                Transaction Analytics
              </h1>
              <p className="text-sm text-[#525252] dark:text-[#a3a3a3] max-w-xl">
                Comprehensive transaction statistics and trends across the network
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-[#737373]">
                  Updated: {formatRelativeTime(lastUpdated)}
                </span>
              </div>

              {/* Time range selector */}
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm text-[#0a0a0a] dark:text-[#fafafa]"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
            </div>
          </div>

          {/* Network filter */}
          <NetworkSelector
            selectedNetwork={selectedNetwork}
            onNetworkChange={setSelectedNetwork}
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

        {loading && !data ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#e5e5e5] dark:border-[#404040] border-t-[#0a0a0a] dark:border-t-[#fafafa] rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Quality Metrics - Highlighted Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <CompactStatCard
                label="Active Agents"
                value={data.stats.active_agents}
                subtitle={`${data.stats.quality_rate}% of total`}
                color="green"
                tooltip="Agents with working endpoints or reputation feedback"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-green-500">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <CompactStatCard
                label="With Reputation"
                value={data.stats.agents_with_reputation}
                tooltip="Agents that received on-chain feedback"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-purple-500">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <CompactStatCard
                label="Working Endpoints"
                value={data.stats.agents_with_working_endpoints}
                tooltip="Agents with reachable HTTP endpoints"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                    <path d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6898C16.4231 14.4392 17.0331 14.0471 17.54 13.54L20.54 10.54C21.4508 9.59699 21.9548 8.33398 21.9434 7.02298C21.932 5.71198 21.4061 4.45794 20.4791 3.53094C19.5521 2.60394 18.2981 2.07802 16.9871 2.06663C15.6761 2.05523 14.4131 2.55918 13.47 3.46998L11.75 5.17998" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60707C11.7643 9.26331 11.0685 9.05889 10.3533 9.00768C9.63816 8.95648 8.92037 9.05963 8.24861 9.31023C7.57685 9.56082 6.96684 9.95294 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04522 15.666 2.05662 16.977C2.06801 18.288 2.59394 19.542 3.52094 20.469C4.44794 21.396 5.70197 21.922 7.01297 21.9334C8.32398 21.9448 9.58699 21.4408 10.53 20.53L12.24 18.82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <CompactStatCard
                label="Total Registered"
                value={data.stats.total_agents_with_tx}
                tooltip="All agents with on-chain registration"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
            </div>

            {/* Transaction Stats - Row 2 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <CompactStatCard
                label="Total TX"
                value={data.stats.total_transactions}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <CompactStatCard
                label="Total Fees"
                value={`${data.stats.total_fees_eth.toFixed(4)} ETH`}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-orange-500">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <CompactStatCard
                label="Reputation TX"
                value={data.stats.transactions_by_type.reputation_update || 0}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-green-500">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <CompactStatCard
                label="Avg TX/Agent"
                value={data.stats.avg_tx_per_agent.toFixed(2)}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
                    <path d="M12 20V10M18 20V4M6 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Transaction Trend Chart */}
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6">
                <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
                  Transaction Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trend_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis
                      dataKey="date"
                      stroke="#737373"
                      fontSize={12}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getMonth() + 1}/${date.getDate()}`
                      }}
                    />
                    <YAxis stroke="#737373" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171717',
                        border: '1px solid #262626',
                        borderRadius: '8px',
                        color: '#fafafa',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke={CHART_COLORS.total}
                      strokeWidth={2}
                      dot={false}
                      name="Total"
                    />
                    <Line
                      type="monotone"
                      dataKey="registered"
                      stroke={CHART_COLORS.registered}
                      strokeWidth={2}
                      dot={false}
                      name="Registered"
                    />
                    <Line
                      type="monotone"
                      dataKey="reputation_update"
                      stroke={CHART_COLORS.reputation_update}
                      strokeWidth={2}
                      dot={false}
                      name="Reputation"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Transaction Type Distribution */}
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6">
                <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
                  Transaction Types
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const { name, percent } = props
                        return `${name} ${(percent * 100).toFixed(0)}%`
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171717',
                        border: '1px solid #262626',
                        borderRadius: '8px',
                        color: '#fafafa',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Agents Table */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden mb-8">
              <div className="p-6 border-b border-[#e5e5e5] dark:border-[#262626]">
                <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                  Top Agents by Transaction Count
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#fafafa] dark:bg-[#0a0a0a]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#737373] uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#737373] uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#737373] uppercase tracking-wider">
                        Network
                      </th>
                      <TableHeader
                        label="Total TX"
                        tooltip="Total on-chain transactions including registration, reputation updates, and validations"
                        align="right"
                      />
                      <TableHeader
                        label="Registered"
                        tooltip="Number of registration events (usually 1 per agent)"
                        align="right"
                      />
                      <TableHeader
                        label="Score Updates"
                        tooltip="Number of times the reputation SCORE changed (not total feedback count). Multiple feedbacks may result in minimal score change."
                        align="right"
                      />
                      <TableHeader
                        label="Validation"
                        tooltip="Number of validation completion events"
                        align="right"
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5e5] dark:divide-[#262626]">
                    {data.top_agents.map((agent, index) => (
                      <tr key={agent.agent_id} className="hover:bg-[#fafafa] dark:hover:bg-[#1f1f1f] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            index === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
                            index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-[#f5f5f5] dark:bg-[#262626] text-[#737373]'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/agents/${agent.agent_id}`}
                            className="font-medium text-[#0a0a0a] dark:text-[#fafafa] hover:underline"
                          >
                            {agent.agent_name}
                          </Link>
                          <p className="text-xs text-[#737373]">
                            Token #{agent.token_id}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#525252] dark:text-[#a3a3a3]">
                          {agent.network_key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-[#0a0a0a] dark:text-[#fafafa]">
                          {agent.total_transactions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#525252] dark:text-[#a3a3a3]">
                          {agent.registered_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#525252] dark:text-[#a3a3a3]">
                          {agent.reputation_update_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#525252] dark:text-[#a3a3a3]">
                          {agent.validation_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Network Stats */}
            {data.network_stats.length > 1 && (
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6">
                <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
                  Network Comparison
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.network_stats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="network_name" stroke="#737373" fontSize={12} />
                    <YAxis stroke="#737373" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171717',
                        border: '1px solid #262626',
                        borderRadius: '8px',
                        color: '#fafafa',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="total_transactions" fill={CHART_COLORS.registered} name="Total TX" />
                    <Bar dataKey="total_agents" fill={CHART_COLORS.reputation_update} name="Total Agents" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

// Table Header with Tooltip
function TableHeader({
  label,
  tooltip,
  align = 'left',
}: {
  label: string
  tooltip: string
  align?: 'left' | 'right'
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <th className={`px-6 py-3 text-${align} text-xs font-medium text-[#737373] uppercase tracking-wider`}>
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        <span>{label}</span>
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[#a3a3a3] hover:text-[#737373] cursor-help transition-colors flex-shrink-0"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {showTooltip && (
            <div className="absolute z-[100] top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1.5 bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] text-[10px] rounded-md shadow-lg w-48 leading-relaxed text-left normal-case font-normal tracking-normal pointer-events-none">
              {tooltip}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0a0a0a] dark:border-b-[#fafafa]" />
            </div>
          )}
        </div>
      </div>
    </th>
  )
}

// Compact Stat Card Component with Tooltip
function CompactStatCard({
  label,
  value,
  icon,
  subtitle,
  color,
  tooltip,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  subtitle?: string
  color?: 'green' | 'blue' | 'purple' | 'orange'
  tooltip?: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  const valueColor = color === 'green' ? 'text-green-600 dark:text-green-400' :
    color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
    color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
    color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
    'text-[#0a0a0a] dark:text-[#fafafa]'

  return (
    <div className="p-3 bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626] relative">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-[#737373] uppercase tracking-wider font-medium flex-1 truncate">{label}</span>
        {tooltip && (
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[#a3a3a3] hover:text-[#737373] cursor-help transition-colors flex-shrink-0"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {showTooltip && (
              <div className="absolute z-50 bottom-full right-0 mb-2 px-2 py-1.5 bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] text-[10px] rounded-md shadow-lg w-44 leading-relaxed">
                {tooltip}
                <div className="absolute top-full right-2 border-4 border-transparent border-t-[#0a0a0a] dark:border-t-[#fafafa]" />
              </div>
            )}
          </div>
        )}
      </div>
      <p className={`text-lg font-semibold ${valueColor}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="text-[10px] text-[#737373] mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}
