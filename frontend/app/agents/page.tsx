'use client'

import { useEffect, useState } from 'react'
import { AgentCard } from '@/components/agent/AgentCard'
import Tabs from '@/components/common/Tabs'
import { SearchBar } from '@/components/common/SearchBar'
import { AgentCardSkeleton } from '@/components/common/Skeleton'
import { FilterSort, type FilterOptions, type SortOption } from '@/components/common/FilterSort'
import { agentService } from '@/lib/api/services'
import type { Agent } from '@/types'

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const pageSize = 20

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true)
        const response = await agentService.getAgents({
          tab: activeTab,
          page,
          page_size: pageSize,
          search: searchQuery || undefined,
        })
        setAgents(response.items)
        setTotal(response.total)
        setTotalPages(response.total_pages)
      } catch (error) {
        console.error('Failed to fetch agents:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [activeTab, searchQuery, page])

  const tabs = [
    { id: 'all', label: 'All Agents' },
    { id: 'active', label: 'Active' },
    { id: 'new', label: 'New' },
    { id: 'top', label: 'Top Rated' },
  ]

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setPage(1) // Reset to first page when changing tabs
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1) // Reset to first page when searching
  }

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

      {/* Tabs and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs tabs={tabs} defaultTab="all" onChange={handleTabChange} />
        <FilterSort />
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
