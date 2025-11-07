'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { RegistrationTrendData } from '@/types'

interface RegistrationTrendChartProps {
  data: RegistrationTrendData[]
}

export function RegistrationTrendChart({ data }: RegistrationTrendChartProps) {
  // Format date display (MM/DD)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // Format chart data
  const chartData = data.map(item => ({
    ...item,
    displayDate: formatDate(item.date)
  }))

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 10 }}
            className="text-foreground/60"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            className="text-foreground/60"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '11px',
              padding: '6px 10px'
            }}
            labelStyle={{ color: 'var(--foreground)', fontSize: '11px' }}
            itemStyle={{ color: 'var(--foreground)', fontSize: '11px' }}
            formatter={(value: number) => [`${value}`, 'Agents']}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return payload[0].payload.date
              }
              return label
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 2 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
