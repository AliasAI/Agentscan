'use client'

import { useState } from 'react'

export interface FilterOptions {
  status?: string[]
  reputationMin?: number
  reputationMax?: number
}

export interface SortOption {
  field: string
  order: 'asc' | 'desc'
}

interface FilterSortProps {
  onFilterChange?: (filters: FilterOptions) => void
  onSortChange?: (sort: SortOption) => void
}

export function FilterSort({ onFilterChange, onSortChange }: FilterSortProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...(filters.status || []), status]
      : (filters.status || []).filter((s) => s !== status)

    const newFilters = { ...filters, status: newStatuses.length > 0 ? newStatuses : undefined }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleReputationChange = (min?: number, max?: number) => {
    const newFilters = {
      ...filters,
      reputationMin: min,
      reputationMax: max
    }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortField(field)
    setSortOrder(order)
    onSortChange?.({ field, order })
  }

  const clearFilters = () => {
    setFilters({})
    onFilterChange?.({})
  }

  const activeFiltersCount =
    (filters.status?.length || 0) +
    (filters.reputationMin !== undefined ? 1 : 0) +
    (filters.reputationMax !== undefined ? 1 : 0)

  return (
    <div className="relative">
      <div className="flex gap-2 items-center">
        {/* Sort Dropdown */}
        <select
          value={`${sortField}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-')
            handleSortChange(field, order as 'asc' | 'desc')
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="reputation_score-desc">Highest Reputation</option>
          <option value="reputation_score-asc">Lowest Reputation</option>
        </select>

        {/* Filter Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear all
            </button>
          </div>

          {/* Status Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="space-y-2">
              {['active', 'inactive', 'validating'].map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status) || false}
                    onChange={(e) => handleStatusChange(status, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reputation Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Reputation Score</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Min"
                value={filters.reputationMin || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : undefined
                  handleReputationChange(val, filters.reputationMax)
                }}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-foreground/60">-</span>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Max"
                value={filters.reputationMax || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : undefined
                  handleReputationChange(filters.reputationMin, val)
                }}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  )
}
