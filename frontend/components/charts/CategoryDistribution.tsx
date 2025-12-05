'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ============================================
// Types
// ============================================

interface CategoryItem {
  category: string
  slug: string
  count: number
  percentage: number
}

interface CategoryDistributionData {
  skills: CategoryItem[]
  domains: CategoryItem[]
  total_classified: number
  total_agents: number
}

interface CategoryDistributionProps {
  data?: CategoryDistributionData
  isLoading?: boolean
}

// ============================================
// Mock data for development (remove when API ready)
// ============================================

const MOCK_DATA: CategoryDistributionData = {
  skills: [
    { category: 'NLP', slug: 'nlp', count: 523, percentage: 34.2 },
    { category: 'Analytics', slug: 'analytical', count: 287, percentage: 18.7 },
    { category: 'Vision', slug: 'vision', count: 184, percentage: 12.0 },
    { category: 'Agent', slug: 'agent', count: 156, percentage: 10.2 },
    { category: 'Others', slug: 'others', count: 384, percentage: 24.9 },
  ],
  domains: [
    { category: 'Technology', slug: 'technology', count: 645, percentage: 42.1 },
    { category: 'Finance', slug: 'finance', count: 312, percentage: 20.3 },
    { category: 'Gaming', slug: 'gaming', count: 198, percentage: 12.9 },
    { category: 'Healthcare', slug: 'healthcare', count: 123, percentage: 8.0 },
    { category: 'Others', slug: 'others', count: 256, percentage: 16.7 },
  ],
  total_classified: 1534,
  total_agents: 4621,
}

// ============================================
// Segmented Bar Component
// ============================================

interface SegmentedBarProps {
  items: CategoryItem[]
  type: 'skills' | 'domains'
  animate?: boolean
}

function SegmentedBar({ items, type, animate = true }: SegmentedBarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  // Intersection observer for scroll-triggered animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (barRef.current) {
      observer.observe(barRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Color palettes - Skills: cool tones, Domains: warm tones
  const getSegmentStyle = (index: number, isHovered: boolean) => {
    const skillColors = [
      'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // Blue → Cyan
      'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Indigo → Purple
      'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)', // Sky → Cyan
      'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)', // Teal
      'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)', // Slate (Others)
    ]

    const domainColors = [
      'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', // Purple → Fuchsia
      'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', // Pink
      'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', // Amber
      'linear-gradient(135deg, #10b981 0%, #34d399 100%)', // Emerald
      'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)', // Gray (Others)
    ]

    const colors = type === 'skills' ? skillColors : domainColors
    const background = colors[index % colors.length]

    return {
      background,
      opacity: hoveredIndex === null || isHovered ? 1 : 0.4,
      transform: isHovered ? 'scaleY(1.15)' : 'scaleY(1)',
      filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
      boxShadow: isHovered
        ? type === 'skills'
          ? '0 0 20px rgba(59, 130, 246, 0.5)'
          : '0 0 20px rgba(139, 92, 246, 0.5)'
        : 'none',
    }
  }

  return (
    <div ref={barRef} className="space-y-2">
      {/* Bar container with tooltip */}
      <div className="relative">
        {/* Progress bar */}
        <div className="relative h-8 rounded-lg overflow-hidden bg-[#f5f5f5] dark:bg-[#1a1a1a]">
          {/* Segments */}
          <div className="absolute inset-0 flex">
            {items.map((item, index) => {
              const isHovered = hoveredIndex === index
              const style = getSegmentStyle(index, isHovered)

              // Calculate cumulative width for animation delay
              const cumulativePercent = items
                .slice(0, index)
                .reduce((sum, i) => sum + i.percentage, 0)

              return (
                <Link
                  key={item.slug}
                  href={`/agents?${type === 'skills' ? 'skills' : 'domains'}=${item.slug}`}
                  className="relative h-full cursor-pointer transition-all duration-300 ease-out"
                  style={{
                    width: animate && isVisible ? `${item.percentage}%` : '0%',
                    ...style,
                    transitionDelay: animate ? `${cumulativePercent * 8}ms` : '0ms',
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Shimmer effect on hover */}
                  {isHovered && (
                    <div
                      className="absolute inset-0 animate-shimmer"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      }}
                    />
                  )}

                  {/* Segment label (show when wide enough) */}
                  {item.percentage >= 18 && (
                    <span
                      className={`
                        absolute inset-0 flex items-center justify-center
                        text-[10px] font-semibold text-white
                        transition-opacity duration-200
                        ${isVisible ? 'opacity-100' : 'opacity-0'}
                      `}
                      style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        transitionDelay: animate ? `${(cumulativePercent + item.percentage) * 8 + 200}ms` : '0ms',
                      }}
                    >
                      {item.category}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Subtle inner shadow */}
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
        </div>

        {/* Tooltip (shows on hover) - positioned above the bar */}
        {hoveredIndex !== null && items[hoveredIndex] && (
          <div
            className="
              absolute left-1/2 -translate-x-1/2 bottom-full mb-2
              z-50 px-3 py-2 rounded-lg
              bg-[#0a0a0a] dark:bg-[#fafafa]
              text-white dark:text-[#0a0a0a]
              text-xs font-medium
              shadow-xl
              animate-fade-in
              pointer-events-none
              whitespace-nowrap
            "
          >
            <div className="flex items-center gap-2">
              <span className="font-bold">{items[hoveredIndex].category}</span>
              <span className="text-[10px] opacity-70">
                {items[hoveredIndex].count.toLocaleString()} agents
              </span>
            </div>
            <div className="text-[10px] opacity-70 mt-0.5">
              {items[hoveredIndex].percentage.toFixed(1)}% of total
            </div>
            {/* Tooltip arrow */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #0a0a0a',
              }}
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.slice(0, 4).map((item, index) => {
          const isHovered = hoveredIndex === index

          return (
            <button
              key={item.slug}
              className={`
                flex items-center gap-1.5 text-[10px]
                transition-all duration-200
                ${isHovered ? 'opacity-100' : 'opacity-70 hover:opacity-100'}
              `}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: getSegmentStyle(index, false).background,
                }}
              />
              <span className="text-[#525252] dark:text-[#a3a3a3] font-medium">
                {item.category}
              </span>
              <span className="text-[#a3a3a3] dark:text-[#525252]">
                {item.percentage.toFixed(0)}%
              </span>
            </button>
          )
        })}
        {items.length > 4 && (
          <span className="text-[10px] text-[#a3a3a3] dark:text-[#525252]">
            +{items.length - 4} more
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================
// Loading Skeleton
// ============================================

function SkeletonBar() {
  return (
    <div className="space-y-2">
      <div className="h-8 rounded-lg bg-[#f5f5f5] dark:bg-[#1a1a1a] overflow-hidden">
        <div
          className="h-full w-full animate-shimmer"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 50%, transparent 100%)',
          }}
        />
      </div>
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-3 w-12 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a]"
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function CategoryDistribution({
  data: propData,
  isLoading = false,
}: CategoryDistributionProps) {
  // Use mock data if no data provided
  const data = propData || MOCK_DATA

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#171717] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-32 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a]" />
          <div className="h-3 w-16 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a]" />
        </div>
        <div className="space-y-5">
          <div>
            <div className="h-3 w-16 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] mb-2" />
            <SkeletonBar />
          </div>
          <div>
            <div className="h-3 w-16 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] mb-2" />
            <SkeletonBar />
          </div>
        </div>
      </div>
    )
  }

  const classificationRate = ((data.total_classified / data.total_agents) * 100).toFixed(0)

  return (
    <div className="bg-white dark:bg-[#171717] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#262626]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
          Category Trends
        </h3>
        <Link
          href="/agents"
          className="text-[10px] font-medium text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors"
        >
          View All →
        </Link>
      </div>

      {/* Classification rate indicator */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#f5f5f5] dark:border-[#262626]">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-[10px] text-[#737373] dark:text-[#737373]">
            {classificationRate}% classified
          </span>
        </div>
        <span className="text-[10px] text-[#a3a3a3] dark:text-[#525252]">
          {data.total_classified.toLocaleString()} / {data.total_agents.toLocaleString()}
        </span>
      </div>

      {/* Skills Distribution */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[#3b82f6]"
          >
            <path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[11px] font-semibold text-[#525252] dark:text-[#a3a3a3] uppercase tracking-wide">
            Skills
          </span>
        </div>
        <SegmentedBar items={data.skills} type="skills" />
      </div>

      {/* Domains Distribution */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[#8b5cf6]"
          >
            <path
              d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[11px] font-semibold text-[#525252] dark:text-[#a3a3a3] uppercase tracking-wide">
            Domains
          </span>
        </div>
        <SegmentedBar items={data.domains} type="domains" />
      </div>
    </div>
  )
}

export default CategoryDistribution
