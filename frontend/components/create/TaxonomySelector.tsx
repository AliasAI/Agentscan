'use client'

/**
 * TaxonomySelector - Multi-select component for OASF Skills/Domains
 *
 * Features:
 * - Fetch data from backend API
 * - Group by category
 * - Search filter (matches name, slug, and category)
 * - Multi-select with chips
 * - Max items limit
 * - Better loading/error states
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { apiGet } from '@/lib/api/client'

interface TaxonomyItem {
  slug: string
  display_name: string
}

interface TaxonomySelectorProps {
  type: 'skills' | 'domains'
  selected: string[]
  onChange: (selected: string[]) => void
  maxItems?: number
  disabled?: boolean
}

export function TaxonomySelector({
  type,
  selected,
  onChange,
  maxItems = 10,
  disabled = false,
}: TaxonomySelectorProps) {
  const [items, setItems] = useState<TaxonomyItem[]>([])
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch taxonomy data
  useEffect(() => {
    setLoading(true)
    setError(null)
    apiGet<{ count: number; skills?: TaxonomyItem[]; domains?: TaxonomyItem[] }>(
      `/taxonomy/${type}`
    )
      .then((data) => {
        const fetchedItems = data[type] || []
        setItems(fetchedItems)
        if (fetchedItems.length === 0) {
          setError('No taxonomy data available')
        }
      })
      .catch((err) => {
        console.error('Failed to fetch taxonomy:', err)
        setError('Failed to load. Is the backend running?')
      })
      .finally(() => setLoading(false))
  }, [type])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, TaxonomyItem[]> = {}
    items.forEach((item) => {
      const parts = item.slug.split('/')
      const category = parts.length > 1 ? parts[0].replace(/_/g, ' ') : 'General'
      if (!groups[category]) groups[category] = []
      groups[category].push(item)
    })
    return groups
  }, [items])

  // Filter items by search (matches display_name, slug, AND category)
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groupedItems
    const searchLower = search.toLowerCase()
    const filtered: Record<string, TaxonomyItem[]> = {}

    Object.entries(groupedItems).forEach(([category, categoryItems]) => {
      // Check if category matches search
      const categoryMatches = category.toLowerCase().includes(searchLower)

      if (categoryMatches) {
        // If category matches, include all items in that category
        filtered[category] = categoryItems
      } else {
        // Otherwise, filter items by name/slug
        const matches = categoryItems.filter(
          (item) =>
            item.display_name.toLowerCase().includes(searchLower) ||
            item.slug.toLowerCase().includes(searchLower)
        )
        if (matches.length > 0) filtered[category] = matches
      }
    })
    return filtered
  }, [groupedItems, search])

  // Count total filtered items
  const filteredCount = useMemo(() => {
    return Object.values(filteredGroups).reduce((acc, items) => acc + items.length, 0)
  }, [filteredGroups])

  const toggleItem = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug))
    } else if (selected.length < maxItems) {
      onChange([...selected, slug])
    }
  }

  const removeItem = (slug: string) => {
    onChange(selected.filter((s) => s !== slug))
  }

  const getDisplayName = (slug: string) => {
    const item = items.find((i) => i.slug === slug)
    return item?.display_name || slug.split('/').pop()?.replace(/_/g, ' ')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Selected items as chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((slug) => (
            <span
              key={slug}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md
                         ${type === 'skills'
                           ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                           : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                         }`}
            >
              {getDisplayName(slug)}
              {!disabled && (
                <button
                  onClick={() => removeItem(slug)}
                  className="hover:opacity-70"
                  type="button"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left text-sm border rounded-lg flex items-center justify-between
                   ${disabled
                     ? 'bg-[#f5f5f5] dark:bg-[#1a1a1a] cursor-not-allowed'
                     : 'bg-white dark:bg-[#0a0a0a] hover:border-[#a3a3a3] dark:hover:border-[#525252]'
                   }
                   ${error ? 'border-orange-300 dark:border-orange-700' : 'border-[#e5e5e5] dark:border-[#333]'}
                   text-[#0a0a0a] dark:text-[#fafafa]`}
      >
        <span className={error ? 'text-orange-500' : 'text-[#6e6e73] dark:text-[#86868b]'}>
          {loading
            ? 'Loading...'
            : error
            ? error
            : selected.length === 0
            ? `Select ${type}...`
            : `${selected.length}/${maxItems} selected`}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div
          className="absolute z-50 mt-1 w-full max-h-72 overflow-auto bg-white dark:bg-[#1a1a1a]
                     border border-[#e5e5e5] dark:border-[#333] rounded-lg shadow-lg"
        >
          {/* Search input with result count */}
          <div className="sticky top-0 p-2 bg-white dark:bg-[#1a1a1a] border-b border-[#e5e5e5] dark:border-[#333]">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${type}... (e.g., "tech", "nlp", "finance")`}
                className="w-full px-3 py-1.5 text-sm bg-[#f5f5f5] dark:bg-[#262626] rounded-md
                         border-none focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] dark:focus:ring-[#fafafa]
                         text-[#0a0a0a] dark:text-[#fafafa] placeholder:text-[#a3a3a3]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
            {/* Search result count */}
            {search && (
              <p className="mt-1 text-xs text-[#6e6e73] dark:text-[#86868b]">
                {filteredCount} {type} found
              </p>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="px-3 py-8 text-center">
              <div className="inline-block w-5 h-5 border-2 border-[#e5e5e5] border-t-[#0a0a0a] dark:border-[#333] dark:border-t-[#fafafa] rounded-full animate-spin" />
              <p className="mt-2 text-sm text-[#6e6e73] dark:text-[#86868b]">Loading {type}...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && items.length === 0 && (
            <div className="px-3 py-6 text-center">
              <svg className="w-8 h-8 mx-auto text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="mt-2 text-sm text-[#6e6e73] dark:text-[#86868b]">{error}</p>
              <p className="mt-1 text-xs text-[#a3a3a3]">Start the backend server first</p>
            </div>
          )}

          {/* Grouped items */}
          {!loading && !error && Object.entries(filteredGroups).map(([category, categoryItems]) => (
            <div key={category}>
              <div className="px-3 py-1.5 text-xs font-medium text-[#6e6e73] dark:text-[#86868b] bg-[#f5f5f5] dark:bg-[#262626] capitalize flex items-center justify-between">
                <span>{category}</span>
                <span className="text-[#a3a3a3]">{categoryItems.length}</span>
              </div>
              {categoryItems.map((item) => {
                const isSelected = selected.includes(item.slug)
                const isItemDisabled = !isSelected && selected.length >= maxItems
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => !isItemDisabled && toggleItem(item.slug)}
                    disabled={isItemDisabled}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2
                               ${isItemDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f5f5f5] dark:hover:bg-[#262626]'}
                               ${isSelected ? 'bg-[#f5f5f5] dark:bg-[#262626]' : ''}`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                                 ${isSelected
                                   ? type === 'skills'
                                     ? 'bg-blue-500 border-blue-500'
                                     : 'bg-purple-500 border-purple-500'
                                   : 'border-[#d4d4d4] dark:border-[#525252]'
                                 }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="text-[#0a0a0a] dark:text-[#fafafa] truncate">{item.display_name}</span>
                  </button>
                )
              })}
            </div>
          ))}

          {/* Empty search result */}
          {!loading && !error && items.length > 0 && Object.keys(filteredGroups).length === 0 && (
            <div className="px-3 py-6 text-center">
              <svg className="w-8 h-8 mx-auto text-[#d4d4d4] dark:text-[#525252]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="mt-2 text-sm text-[#6e6e73] dark:text-[#86868b]">
                No {type} matching &quot;{search}&quot;
              </p>
              <p className="mt-1 text-xs text-[#a3a3a3]">
                Try searching for category names like &quot;technology&quot; or &quot;nlp&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
