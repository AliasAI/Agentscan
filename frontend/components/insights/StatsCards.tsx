'use client'

interface StatCardData {
  label: string
  value: number | string
  color?: 'green' | 'blue' | 'purple'
  tooltip?: string
  subtitle?: string
}

interface StatsCardsProps {
  cards: StatCardData[]
}

export function StatsCards({ cards }: StatsCardsProps) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-12 gap-y-4 mb-8 py-2">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}

function StatCard({ label, value, color, tooltip, subtitle }: StatCardData) {
  const valueColor =
    color === 'green' ? 'text-green-600 dark:text-green-400' :
    color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
    color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
    'text-[#0a0a0a] dark:text-[#fafafa]'

  return (
    <div className="text-center group relative">
      <div className={`text-2xl md:text-3xl font-bold tabular-nums ${valueColor}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-[11px] font-medium text-[#737373] uppercase tracking-wide mt-0.5">
        {label}
      </div>
      {subtitle && (
        <div className="text-[10px] text-[#a3a3a3] dark:text-[#525252] mt-0.5">{subtitle}</div>
      )}
      {tooltip && (
        <div className="
          pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          px-2.5 py-1.5 rounded-lg text-[11px] text-white bg-[#0a0a0a] dark:bg-[#fafafa] dark:text-[#0a0a0a]
          whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150
          shadow-lg
        ">
          {tooltip}
        </div>
      )}
    </div>
  )
}
