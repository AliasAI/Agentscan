'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { AgentCard } from '@/components/agent/AgentCard'
import Tabs from '@/components/common/Tabs'
import { SearchBar } from '@/components/common/SearchBar'
import { AgentCardSkeleton } from '@/components/common/Skeleton'
import { FilterSort, type FilterOptions, type SortOption } from '@/components/common/FilterSort'
import { NetworkSelector } from '@/components/common/NetworkSelector'
import { agentService } from '@/lib/api/services'
import type { Agent } from '@/types'

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState('all')
  const [filters, setFilters] = useState<FilterOptions>({})
  const [sortOption, setSortOption] = useState<SortOption>({ field: 'created_at', order: 'desc' })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const pageRef = useRef(1)
  const pageSize = 20
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchAgents = useCallback(async (pageNum: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setLoading(true)

      const response = await agentService.getAgents({
        tab: activeTab,
        page: pageNum,
        page_size: pageSize,
        search: searchQuery || undefined,
        network: selectedNetwork !== 'all' ? selectedNetwork : undefined,
        reputation_min: filters.reputationMin,
        reputation_max: filters.reputationMax,
      }, abortController.signal)

      if (!abortController.signal.aborted) {
        setAgents(response.items)
        setTotal(response.total)
        setTotalPages(response.total_pages)
        setPage(pageNum)
        pageRef.current = pageNum
      }
    } catch (error: unknown) {
      const err = error as { name?: string }
      if (err.name !== 'AbortError' && !abortController.signal.aborted) {
        console.error('Failed to fetch agents:', error)
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
  }, [activeTab, searchQuery, selectedNetwork, filters, pageSize])

  useEffect(() => {
    fetchAgents(1)

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [activeTab, searchQuery, selectedNetwork, filters, fetchAgents])

  const tabs = [
    { id: 'all', label: 'All Agents' },
    { id: 'active', label: 'Active' },
    { id: 'top', label: 'Top Rated' },
  ]

  const handleTabChange = (tabId: string) => setActiveTab(tabId)
  const handleSearch = (query: string) => setSearchQuery(query)
  const handleNetworkChange = (networkId: string) => setSelectedNetwork(networkId)
  const handleFilterChange = (newFilters: FilterOptions) => setFilters(newFilters)

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort)
    if (sort.field === 'reputation_score') {
      setActiveTab('top')
    } else if (activeTab === 'top') {
      setActiveTab('all')
    }
  }

  const handleNextPage = useCallback(() => {
    const nextPage = Math.min(totalPages, page + 1)
    if (nextPage !== page) fetchAgents(nextPage)
  }, [page, totalPages, fetchAgents])

  const handlePrevPage = useCallback(() => {
    const prevPage = Math.max(1, page - 1)
    if (prevPage !== page) fetchAgents(prevPage)
  }, [page, fetchAgents])

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages && pageNum !== page) {
      fetchAgents(pageNum)
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = page - 1; i <= page + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Page Header with subtle gradient */}
      <div className="relative border-b border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.03] dark:opacity-[0.02]"
            style={{
              background: 'radial-gradient(circle, #0a0a0a 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full opacity-[0.02] dark:opacity-[0.015]"
            style={{
              background: 'radial-gradient(circle, #0a0a0a 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#737373] mb-4">
            <Link href="/" className="hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors">
              Home
            </Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#d4d4d4] dark:text-[#404040]">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[#0a0a0a] dark:text-[#fafafa] font-medium">Agents</span>
          </nav>

          {/* Title section */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-2 tracking-tight">
                AI Agents
              </h1>
              <p className="text-sm text-[#525252] dark:text-[#a3a3a3] max-w-xl">
                Discover and explore {total > 0 ? total.toLocaleString() : ''} registered AI agents on the ERC-8004 protocol
              </p>
            </div>

            {/* Stats badges */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626]">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-xs font-medium text-[#525252] dark:text-[#a3a3a3]">
                  {total.toLocaleString()} Total
                </span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="sticky top-14 lg:top-16 z-40 bg-[#fafafa]/95 dark:bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <NetworkSelector
                selectedNetwork={selectedNetwork}
                onNetworkChange={handleNetworkChange}
              />
              <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide">
                <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
              </div>
            </div>
            <FilterSort onFilterChange={handleFilterChange} onSortChange={handleSortChange} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Results info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#737373] dark:text-[#737373]">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#e5e5e5] dark:border-[#404040] border-t-[#0a0a0a] dark:border-t-[#fafafa] rounded-full animate-spin" />
                Loading agents...
              </span>
            ) : (
              <>
                Showing <span className="font-medium text-[#0a0a0a] dark:text-[#fafafa]">{agents.length}</span> of{' '}
                <span className="font-medium text-[#0a0a0a] dark:text-[#fafafa]">{total.toLocaleString()}</span> agents
              </>
            )}
          </p>
        </div>

        {/* Agent Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div
                key={i}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <AgentCardSkeleton />
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative mb-6">
              {/* Decorative circles */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] animate-spin" style={{ animationDuration: '20s' }} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border border-[#e5e5e5] dark:border-[#262626]" />
              </div>
              <div className="relative w-16 h-16 bg-[#f5f5f5] dark:bg-[#171717] rounded-2xl flex items-center justify-center m-8">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3] dark:text-[#525252]">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">
              No agents found
            </h3>
            <p className="text-sm text-[#737373] dark:text-[#737373] text-center max-w-md mb-6">
              We couldn&apos;t find any agents matching your criteria. Try adjusting your filters or search query.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedNetwork('all')
                setFilters({})
                setActiveTab('all')
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] rounded-lg text-sm font-medium hover:bg-[#262626] dark:hover:bg-[#e5e5e5] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C9.69494 3 7.59227 3.86991 6 5.29168M6 5.29168V2M6 5.29168H2.70833" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {agents.map((agent, index) => (
                <div
                  key={agent.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <AgentCard agent={agent} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#e5e5e5] dark:border-[#262626]">
                <p className="text-sm text-[#737373] dark:text-[#737373] order-2 sm:order-1">
                  Page {page} of {totalPages}
                </p>

                <div className="flex items-center gap-1 order-1 sm:order-2">
                  {/* Previous button */}
                  <button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="
                      inline-flex items-center justify-center w-9 h-9 rounded-lg
                      text-[#525252] dark:text-[#a3a3a3]
                      hover:bg-[#f5f5f5] dark:hover:bg-[#262626]
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                      transition-colors
                    "
                    title="Previous page"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum, index) => (
                      pageNum === '...' ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="w-9 h-9 flex items-center justify-center text-[#a3a3a3] dark:text-[#525252] text-sm"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum as number)}
                          className={`
                            w-9 h-9 rounded-lg text-sm font-medium transition-all
                            ${page === pageNum
                              ? 'bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a]'
                              : 'text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]'
                            }
                          `}
                        >
                          {pageNum}
                        </button>
                      )
                    ))}
                  </div>

                  {/* Next button */}
                  <button
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    className="
                      inline-flex items-center justify-center w-9 h-9 rounded-lg
                      text-[#525252] dark:text-[#a3a3a3]
                      hover:bg-[#f5f5f5] dark:hover:bg-[#262626]
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                      transition-colors
                    "
                    title="Next page"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
