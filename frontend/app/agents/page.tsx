'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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

  // Use ref to track the actual page to avoid React StrictMode issues
  const pageRef = useRef(1)

  const pageSize = 20

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAgents = useCallback(async (pageNum: number) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true)
      console.log(`Fetching agents for page ${pageNum}`)

      const response = await agentService.getAgents({
        tab: activeTab,
        page: pageNum,
        page_size: pageSize,
        search: searchQuery || undefined,
        network: selectedNetwork !== 'all' ? selectedNetwork : undefined,
        reputation_min: filters.reputationMin,
        reputation_max: filters.reputationMax,
      }, abortController.signal)

      // Only update state if the request wasn't aborted
      if (!abortController.signal.aborted) {
        setAgents(response.items)
        setTotal(response.total)
        setTotalPages(response.total_pages)
        setPage(pageNum) // Update page state after successful fetch
        pageRef.current = pageNum // Update ref as well
        console.log(`Successfully loaded page ${pageNum}`)
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name !== 'AbortError' && !abortController.signal.aborted) {
        console.error('Failed to fetch agents:', error)
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
  }, [activeTab, searchQuery, selectedNetwork, filters, pageSize])

  // Initial load and when filters change
  useEffect(() => {
    fetchAgents(1) // Always fetch page 1 when these change

    // Cleanup function - abort any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [activeTab, searchQuery, selectedNetwork, filters, fetchAgents])

  const tabs = [
    { id: 'all', label: 'All Agents' },
    { id: 'active', label: 'Active' },
    { id: 'new', label: 'New' },
    { id: 'top', label: 'Top Rated' },
  ]

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    // fetchAgents(1) will be called by useEffect when activeTab changes
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // fetchAgents(1) will be called by useEffect when searchQuery changes
  }

  const handleNetworkChange = (networkId: string) => {
    setSelectedNetwork(networkId)
    // fetchAgents(1) will be called by useEffect when selectedNetwork changes
  }

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    // fetchAgents(1) will be called by useEffect when filters changes
  }

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort)
    // For now, sorting is handled by the backend through the tab parameter
    // We could add explicit sort parameters to the API in the future
    if (sort.field === 'reputation_score') {
      setActiveTab('top')
    } else if (activeTab === 'top') {
      setActiveTab('all')
    }
  }

  const handleNextPage = useCallback(() => {
    const nextPage = Math.min(totalPages, page + 1);
    if (nextPage !== page) {
      console.log('Next page clicked:', page, '->', nextPage);
      fetchAgents(nextPage);
    }
  }, [page, totalPages, fetchAgents]);

  const handlePrevPage = useCallback(() => {
    const prevPage = Math.max(1, page - 1);
    if (prevPage !== page) {
      console.log('Prev page clicked:', page, '->', prevPage);
      fetchAgents(prevPage);
    }
  }, [page, fetchAgents]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI Agents</h1>
        <p className="text-foreground/60 mb-6">
          Browse and explore all registered AI agents on the ERC-8004 protocol
        </p>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Network Selector and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <NetworkSelector
            selectedNetwork={selectedNetwork}
            onNetworkChange={handleNetworkChange}
          />
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
        </div>
        <FilterSort onFilterChange={handleFilterChange} onSortChange={handleSortChange} />
      </div>

      {/* Results Info */}
      <div className="mb-4 text-sm text-foreground/60">
        {loading ? (
          'Loading...'
        ) : (
          `Showing ${agents.length} of ${total} agents`
        )}
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: pageSize }).map((_, i) => (
            <AgentCardSkeleton key={i} />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 text-foreground/60">
          No agents found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
