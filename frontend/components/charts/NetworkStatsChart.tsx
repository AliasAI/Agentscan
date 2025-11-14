'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface NetworkStats {
  network: string
  agents: number
  active: number
}

interface NetworkStatsChartProps {
  data: NetworkStats[]
}

export function NetworkStatsChart({ data }: NetworkStatsChartProps) {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis
            dataKey="network"
            tick={{ fontSize: 11 }}
            className="text-foreground/60"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            className="text-foreground/60"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              padding: '8px 12px'
            }}
            labelStyle={{ color: 'var(--foreground)', fontSize: '12px' }}
            itemStyle={{ color: 'var(--foreground)', fontSize: '12px' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          <Bar dataKey="agents" fill="#3b82f6" name="Total Agents" radius={[4, 4, 0, 0]} />
          <Bar dataKey="active" fill="#22c55e" name="Active Agents" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
