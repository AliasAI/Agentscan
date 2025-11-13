'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ActivityData {
  date: string
  count: number
}

interface ActivityTrendChartProps {
  data: ActivityData[]
}

export function ActivityTrendChart({ data }: ActivityTrendChartProps) {
  // Format date display (MM/DD)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // Format chart data
  const chartData = data.map(item => ({
    ...item,
    displayDate: formatDate(item.date),
    Activities: item.count
  }))

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis
            dataKey="displayDate"
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
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return payload[0].payload.date
              }
              return label
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          <Bar
            dataKey="Activities"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
