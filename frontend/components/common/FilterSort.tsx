'use client'

import { useState, useRef, useEffect } from 'react'

export interface FilterOptions {
  reputationMin?: number
  reputationMax?: number
  hasReputation?: boolean
}

export interface SortOption {
  field: string
  order: 'asc' | 'desc'
}

const SORT_OPTIONS: { value: string; label: string; field: string; order: 'asc' | 'desc' }[] = [
  { value: 'created_at-desc', label: 'Newest First', field: 'created_at', order: 'desc' },
  { value: 'created_at-asc', label: 'Oldest First', field: 'created_at', order: 'asc' },
  { value: 'name-asc', label: 'Name (A-Z)', field: 'name', order: 'asc' },
  { value: 'name-desc', label: 'Name (Z-A)', field: 'name', order: 'desc' },
  { value: 'reputation_score-desc', label: 'Highest Reputation', field: 'reputation_score', order: 'desc' },
  { value: 'reputation_score-asc', label: 'Lowest Reputation', field: 'reputation_score', order: 'asc' },
]

interface FilterSortProps {
  onFilterChange?: (filters: FilterOptions) => void
  onSortChange?: (sort: SortOption) => void
  filters?: FilterOptions
  sort?: SortOption
}

export function FilterSort({ onFilterChange, onSortChange, filters = {}, sort }: FilterSortProps) {
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const currentSort = sort
    ? `${sort.field}-${sort.order}`
    : 'created_at-desc'

  const currentLabel = SORT_OPTIONS.find(o => o.value === currentSort)?.label || 'Newest First'

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    if (sortOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sortOpen])

  const handleSortSelect = (option: typeof SORT_OPTIONS[0]) => {
    onSortChange?.({ field: option.field, order: option.order })
    setSortOpen(false)
  }

  const toggleHasReputation = () => {
    const next = !filters.hasReputation
    onFilterChange?.({
      ...filters,
      hasReputation: next || undefined,
    })
  }

  return (
    <div className="flex items-center gap-2">
      {/* Has Reviews toggle */}
      <button
        onClick={toggleHasReputation}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-200 border whitespace-nowrap
          ${filters.hasReputation
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            : 'bg-white dark:bg-[#171717] text-[#525252] dark:text-[#a3a3a3] border-[#e5e5e5] dark:border-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040]'
          }
        `}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={filters.hasReputation ? 'text-amber-500' : 'text-[#a3a3a3]'}>
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Has Reviews
      </button>

      {/* Sort dropdown */}
      <div ref={sortRef} className="relative">
        <button
          onClick={() => setSortOpen(!sortOpen)}
          className="
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            bg-white dark:bg-[#171717] text-[#525252] dark:text-[#a3a3a3]
            border border-[#e5e5e5] dark:border-[#262626]
            hover:border-[#d4d4d4] dark:hover:border-[#404040]
            transition-all duration-200 whitespace-nowrap
          "
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3]">
            <path d="M3 6H7M3 12H11M3 18H15M17 4V20M17 4L13 8M17 4L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {currentLabel}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={`text-[#a3a3a3] transition-transform ${sortOpen ? 'rotate-180' : ''}`}>
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {sortOpen && (
          <div className="absolute top-full mt-1 right-0 w-48 bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-xl shadow-lg overflow-hidden z-50">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortSelect(option)}
                className={`
                  w-full text-left px-3 py-2 text-xs transition-colors
                  ${currentSort === option.value
                    ? 'bg-[#f5f5f5] dark:bg-[#262626] text-[#0a0a0a] dark:text-[#fafafa] font-medium'
                    : 'text-[#525252] dark:text-[#a3a3a3] hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a]'
                  }
                `}
              >
                <span className="flex items-center justify-between">
                  {option.label}
                  {currentSort === option.value && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#0a0a0a] dark:text-[#fafafa]">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
