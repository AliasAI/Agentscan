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
            {/* Summary Stats - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatCard
                label="Total Transactions"
                value={data.stats.total_transactions}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <StatCard
                label="Active Agents"
                value={data.stats.total_agents_with_tx}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-500">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <StatCard
                label="Total Fees"
                value={`${data.stats.total_fees_eth.toFixed(4)} ETH`}
                subtitle={`${(data.stats.total_fees_wei / 1e9).toFixed(2)} Gwei`}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-orange-500">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <StatCard
                label="Avg Fee per TX"
                value={`${(data.stats.avg_fee_per_tx_eth * 1000).toFixed(4)} mETH`}
                subtitle={`${(data.stats.avg_fee_per_tx_eth * 1e9).toFixed(2)} Gwei`}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-500">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                }
              />
            </div>

            {/* Summary Stats - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Gas Used"
                value={data.stats.total_gas_used.toLocaleString()}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-500">
                    <path d="M3 3H9V19H3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 8H10C10.5304 8 11.0391 8.21071 11.4142 8.58579C11.7893 8.96086 12 9.46957 12 10V15C12 15.5304 12.2107 16.0391 12.5858 16.4142C12.9609 16.7893 13.4696 17 14 17C14.5304 17 15.0391 16.7893 15.4142 16.4142C15.7893 16.0391 16 15.5304 16 15V6L19 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <StatCard
                label="Avg TX per Agent"
                value={data.stats.avg_tx_per_agent.toFixed(2)}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                    <path d="M12 20V10M18 20V4M6 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <StatCard
                label="Registrations"
                value={data.stats.transactions_by_type.registered || 0}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-500">
                    <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21M4 7H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <StatCard
                label="Reputation Updates"
                value={data.stats.transactions_by_type.reputation_update || 0}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-500">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#737373] uppercase tracking-wider">
                        Total TX
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#737373] uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#737373] uppercase tracking-wider">
                        Reputation
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#737373] uppercase tracking-wider">
                        Validation
                      </th>
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

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  subtitle,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  subtitle?: string
}) {
  return (
    <div className="p-4 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626]">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-[#737373] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="text-xs text-[#737373] mt-1">{subtitle}</p>
      )}
    </div>
  )
}
