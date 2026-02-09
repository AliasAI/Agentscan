'use client'

import type { TxTrendData, NetworkTxStats } from '@/types'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const CHART_COLORS = {
  registered: '#3b82f6',
  reputation_update: '#8b5cf6',
  total: '#0a0a0a',
}

const TOOLTIP_STYLE = {
  backgroundColor: '#171717',
  border: '1px solid #262626',
  borderRadius: '8px',
  color: '#fafafa',
}

interface TrendChartsProps {
  trendData: TxTrendData[]
  networkStats: NetworkTxStats[]
  days: number
  onDaysChange: (days: number) => void
}

export function TrendCharts({ trendData, networkStats, days, onDaysChange }: TrendChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Transaction Trend */}
      <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
            Transaction Trend
          </h3>
          <select
            value={days}
            onChange={(e) => onDaysChange(Number(e.target.value))}
            className="px-2 py-1 bg-[#f5f5f5] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-xs text-[#525252] dark:text-[#a3a3a3]"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="date"
              stroke="#737373"
              fontSize={11}
              tickFormatter={(value) => {
                const d = new Date(value)
                return `${d.getMonth() + 1}/${d.getDate()}`
              }}
            />
            <YAxis stroke="#737373" fontSize={11} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke={CHART_COLORS.total} strokeWidth={2} dot={false} name="Total" />
            <Line type="monotone" dataKey="registered" stroke={CHART_COLORS.registered} strokeWidth={2} dot={false} name="Registered" />
            <Line type="monotone" dataKey="reputation_update" stroke={CHART_COLORS.reputation_update} strokeWidth={2} dot={false} name="Reputation" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Network Comparison (only when multiple networks) */}
      {networkStats.length > 1 ? (
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6">
          <h3 className="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
            Network Comparison
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={networkStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="network_name" stroke="#737373" fontSize={11} />
              <YAxis stroke="#737373" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Bar dataKey="total_transactions" fill="#3b82f6" name="Transactions" />
              <Bar dataKey="total_agents" fill="#8b5cf6" name="Agents" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* Placeholder card when single network */
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-[#f5f5f5] dark:bg-[#262626] rounded-xl flex items-center justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3]">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 2C14.5 4.74 16 8.29 16 12C16 15.71 14.5 19.26 12 22C9.5 19.26 8 15.71 8 12C8 8.29 9.5 4.74 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <p className="text-sm text-[#737373] text-center">
            Network comparison will appear when multiple networks have data
          </p>
        </div>
      )}
    </div>
  )
}
