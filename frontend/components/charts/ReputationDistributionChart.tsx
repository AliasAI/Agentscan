'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface ReputationDistribution {
  range: string
  count: number
}

interface ReputationDistributionChartProps {
  data: ReputationDistribution[]
}

const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e']

export function ReputationDistributionChart({ data }: ReputationDistributionChartProps) {
  // Add percentage to data
  const total = data.reduce((sum, item) => sum + item.count, 0)
  const chartData = data.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0'
  }))

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ range, percentage }) => `${range}: ${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              padding: '8px 12px'
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} agents (${props.payload.percentage}%)`,
              props.payload.range
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
