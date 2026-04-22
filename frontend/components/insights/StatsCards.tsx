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
    <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
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
    <div className="group relative rounded-2xl border border-[#e5e5e5] bg-white px-4 py-4 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.22)] dark:border-[#262626] dark:bg-[#171717]">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#8a877d] dark:text-[#5f5f5f]">
        {label}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${valueColor}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <div className="mt-1 text-[11px] text-[#6d6b63] dark:text-[#8a8a8a]">{subtitle}</div>
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
