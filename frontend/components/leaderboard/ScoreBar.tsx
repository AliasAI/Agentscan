'use client'

interface ScoreBarProps {
  value: number
  max?: number
  color?: 'blue' | 'green' | 'purple' | 'orange'
  size?: 'sm' | 'md'
}

const colorMap = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
}

export function ScoreBar({ value, max = 100, color = 'blue', size = 'sm' }: ScoreBarProps) {
  const pct = Math.min(Math.max(value / max * 100, 0), 100)
  const h = size === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div className={`w-full ${h} bg-[#f5f5f5] dark:bg-[#262626] rounded-full overflow-hidden`}>
      <div
        className={`${h} ${colorMap[color]} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

interface ScoreCellProps {
  label: string
  value: number
  color: 'blue' | 'green' | 'purple' | 'orange'
}

export function ScoreCell({ label, value, color }: ScoreCellProps) {
  return (
    <div className="min-w-[80px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[#737373] uppercase tracking-wider">{label}</span>
        <span className="text-xs font-medium text-[#525252] dark:text-[#a3a3a3]">
          {value.toFixed(0)}
        </span>
      </div>
      <ScoreBar value={value} color={color} />
    </div>
  )
}
