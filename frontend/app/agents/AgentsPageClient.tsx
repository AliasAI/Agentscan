'use client'

import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SearchBar } from '@/components/common/SearchBar'
import { FilterSort, type FilterOptions, type SortOption } from '@/components/common/FilterSort'
import { NetworkSelector } from '@/components/common/NetworkSelector'
import { AgentListRow, AgentListHeader, AgentListRowSkeleton, AGENT_LIST_CONTAINER_CLASS } from '@/components/agent/AgentListRow'
import { agentService } from '@/lib/api/services'
import type { Agent } from '@/types'

export default function AgentsPage() {
  return (
    <Suspense>
      <AgentsPageContent />
    </Suspense>
  )
}

function AgentsPageContent() {
  const searchParams = useSearchParams()
  const initialEcosystem = searchParams.get('ecosystem') || 'all'
  const initialCapability = searchParams.get('capability') || 'all'
  const [agents, setAgents] = useState<Agent[]>([])
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedNetwork, setSelectedNetwork] = useState('all')
  const [selectedEcosystem, setSelectedEcosystem] = useState(initialEcosystem)
  const [selectedCapability, setSelectedCapability] = useState(initialCapability)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [sortOption, setSortOption] = useState<SortOption>({ field: 'created_at', order: 'desc' })
  const [qualityFilter, setQualityFilter] = useState<'all' | 'basic' | 'verified'>(
    initialEcosystem !== 'all' || initialCapability !== 'all' ? 'all' : 'basic'
  )
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

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
        page: pageNum,
        page_size: pageSize,
        search: searchQuery || undefined,
        network: selectedNetwork !== 'all' ? selectedNetwork : undefined,
        ecosystem: selectedEcosystem !== 'all' ? selectedEcosystem : undefined,
        capability: selectedCapability !== 'all' ? selectedCapability : undefined,
        reputation_min: filters.reputationMin,
        reputation_max: filters.reputationMax,
        has_reputation: filters.hasReputation || undefined,
        quality: qualityFilter,
        sort_field: sortOption.field,
        sort_order: sortOption.order,
      }, abortController.signal)

      if (!abortController.signal.aborted) {
        setAgents(response.items)
        setTotal(response.total)
        setTotalPages(response.total_pages)
        setPage(pageNum)
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
  }, [searchQuery, selectedNetwork, selectedEcosystem, selectedCapability, filters, qualityFilter, sortOption])

  useEffect(() => {
    fetchAgents(1)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchAgents])

  useEffect(() => {
    if ((selectedEcosystem !== 'all' || selectedCapability !== 'all') && qualityFilter !== 'all') {
      setQualityFilter('all')
    }
  }, [selectedEcosystem, selectedCapability, qualityFilter])

  const headingDescription =
    selectedEcosystem !== 'all' || selectedCapability !== 'all'
      ? `Browse ${total > 0 ? total.toLocaleString() : ''} agents filtered by ecosystem and capability`
      : `Discover and explore ${total > 0 ? total.toLocaleString() : ''} registered AI agents on the ERC-8004 protocol`

  const handleSearch = (query: string) => setSearchQuery(query)
  const handleNetworkChange = (networkId: string) => setSelectedNetwork(networkId)
  const handleFilterChange = (newFilters: FilterOptions) => setFilters(newFilters)
  const handleSortChange = (sort: SortOption) => setSortOption(sort)

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

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (page <= 3) {
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

    return pages
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <nav className="flex items-center gap-2 text-xs text-[#737373] mb-4">
            <Link href="/" className="hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors">
              Home
            </Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#d4d4d4] dark:text-[#404040]">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[#0a0a0a] dark:text-[#fafafa] font-medium">Agents</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-2 tracking-tight">
                Agent Index
              </h1>
              <p className="text-sm text-[#525252] dark:text-[#a3a3a3] max-w-xl">
                {headingDescription}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626]">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-xs font-medium text-[#525252] dark:text-[#a3a3a3]">
                  {total.toLocaleString()} Total
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-2xl">
            <SearchBar defaultValue={searchQuery} onSearch={handleSearch} />
          </div>
        </div>
      </div>

      <div className="sticky top-14 lg:top-16 z-40 border-b border-[#e5e5e5] bg-[#fafafa]/95 backdrop-blur-sm dark:border-[#262626] dark:bg-[#0a0a0a]/95">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <NetworkSelector
                selectedNetwork={selectedNetwork}
                onNetworkChange={handleNetworkChange}
              />
              <select
                value={selectedEcosystem}
                onChange={(e) => setSelectedEcosystem(e.target.value)}
                className="h-9 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] px-3 text-xs text-[#525252] dark:text-[#a3a3a3]"
              >
                <option value="all">All Ecosystems</option>
                <option value="virtuals_acp">Virtuals ACP</option>
                <option value="bnbagent">BNB Agent</option>
                <option value="coinbase">Payments</option>
              </select>
              <select
                value={selectedCapability}
                onChange={(e) => setSelectedCapability(e.target.value)}
                className="h-9 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] px-3 text-xs text-[#525252] dark:text-[#a3a3a3]"
              >
                <option value="all">All Capabilities</option>
                <option value="acp">ACP</option>
                <option value="erc8183">ERC-8183</option>
                <option value="x402">x402</option>
                <option value="agentkit">AgentKit</option>
                <option value="payable">Payable</option>
              </select>
              <button
                onClick={() => setQualityFilter(qualityFilter === 'all' ? 'basic' : 'all')}
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-200 border whitespace-nowrap
                  ${qualityFilter !== 'all'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-white dark:bg-[#171717] text-[#525252] dark:text-[#a3a3a3] border-[#e5e5e5] dark:border-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040]'
                  }
                `}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={qualityFilter !== 'all' ? 'text-emerald-500' : 'text-[#a3a3a3]'}
                >
                  <path
                    d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1952 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 4L12 14.01L9 11.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {qualityFilter !== 'all' ? 'Quality Only' : 'Show All'}
              </button>
            </div>
            <FilterSort
              filters={filters}
              sort={sortOption}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-[#737373] dark:text-[#737373]">
          <span className="font-medium uppercase tracking-wide text-[#525252] dark:text-[#a3a3a3]">Filters</span>
          <span>Network: {selectedNetwork === 'all' ? 'All' : selectedNetwork}</span>
          <span>•</span>
          <span>Ecosystem: {selectedEcosystem === 'all' ? 'All' : selectedEcosystem}</span>
          <span>•</span>
          <span>Capability: {selectedCapability === 'all' ? 'All' : selectedCapability}</span>
          <span>•</span>
          <span>Quality: {qualityFilter}</span>
        </div>

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

        {loading ? (
          <div className={AGENT_LIST_CONTAINER_CLASS}>
            <AgentListHeader />
            <div className="divide-y divide-[#ebebeb] dark:divide-[#2a2a2a]">
              {Array.from({ length: pageSize }).map((_, i) => (
                <AgentListRowSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative mb-6">
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
                setSelectedEcosystem('all')
                setSelectedCapability('all')
                setFilters({})
                setSortOption({ field: 'created_at', order: 'desc' })
                setQualityFilter('basic')
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
            <div className={AGENT_LIST_CONTAINER_CLASS}>
              <AgentListHeader />
              {agents.map((agent, index) => (
                <AgentListRow
                  key={agent.id}
                  agent={agent}
                  isLast={index === agents.length - 1}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="px-3 py-2 rounded-lg border border-[#e5e5e5] dark:border-[#262626] text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                {getPageNumbers().map((pageNum, index) => (
                  typeof pageNum === 'string' ? (
                    <span key={`${pageNum}-${index}`} className="px-2 text-sm text-[#737373]">...</span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium ${
                        pageNum === page
                          ? 'bg-[#0a0a0a] text-white dark:bg-[#fafafa] dark:text-[#0a0a0a]'
                          : 'border border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded-lg border border-[#e5e5e5] dark:border-[#262626] text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
