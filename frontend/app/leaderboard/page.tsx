'use client'

import { useState, useEffect, useCallback } from 'react'
import { leaderboardService } from '@/lib/api/services'
import type { LeaderboardItem } from '@/types'
import { NetworkSelector } from '@/components/common/NetworkSelector'
import { TopPodium } from '@/components/leaderboard/TopPodium'
import { RankTable } from '@/components/leaderboard/RankTable'

const SORT_OPTIONS = [
  { value: 'score', label: 'Overall' },
  { value: 'service', label: 'Service' },
  { value: 'usage', label: 'Usage' },
  { value: 'freshness', label: 'Freshness' },
  { value: 'profile', label: 'Profile' },
]

export default function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [network, setNetwork] = useState('all')
  const [sortBy, setSortBy] = useState('score')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await leaderboardService.getLeaderboard({
        page,
        page_size: 20,
        network: network === 'all' ? undefined : network,
        sort_by: sortBy,
      })
      setItems(data.items)
      setTotalPages(data.total_pages)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }, [page, network, sortBy])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset page when filters change
  const handleNetworkChange = (nw: string) => {
    setNetwork(nw)
    setPage(1)
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setPage(1)
  }

  // Split top 3 from remaining (only on page 1 with default sort)
  const showPodium = page === 1 && sortBy === 'score'
  const podiumItems = showPodium ? items.slice(0, 3) : []
  const tableItems = showPodium ? items.slice(3) : items

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
            Leaderboard
          </h1>
          <p className="text-sm text-[#737373] mt-1">
            {loading ? (
              <span className="inline-block w-32 h-4 bg-[#e5e5e5] dark:bg-[#262626] rounded animate-pulse" />
            ) : (
              `${total.toLocaleString()} agents ranked by composite score`
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort selector */}
          <div className="flex items-center bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg overflow-hidden">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSortChange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  sortBy === opt.value
                    ? 'bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a]'
                    : 'text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <NetworkSelector
            selectedNetwork={network}
            onNetworkChange={handleNetworkChange}
          />
        </div>
      </div>

      {/* Score legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-[11px] text-[#737373]">
        <span className="font-medium text-[#525252] dark:text-[#a3a3a3]">Score Dimensions:</span>
        {[
          { color: 'bg-green-500', label: 'Service (15%)', tip: 'Ratio of healthy endpoints' },
          { color: 'bg-blue-500', label: 'Usage (60%)', tip: 'Feedback count + reputation score' },
          { color: 'bg-purple-500', label: 'Freshness (15%)', tip: 'Recency of last feedback (30-90d decay)' },
          { color: 'bg-orange-500', label: 'Profile (10%)', tip: 'Name, description, skills & domains' },
        ].map((d) => (
          <span key={d.label} className="relative group flex items-center gap-1.5 cursor-default">
            <span className={`w-2 h-2 rounded-full ${d.color}`} />
            {d.label}
            <span className="
              pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              px-2.5 py-1.5 rounded-lg text-[11px] text-white bg-[#0a0a0a] dark:bg-[#fafafa] dark:text-[#0a0a0a]
              whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150
              shadow-lg
            ">
              {d.tip}
            </span>
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#e5e5e5] dark:border-[#404040] border-t-[#0a0a0a] dark:border-t-[#fafafa] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {showPodium && <TopPodium items={podiumItems} />}

          {/* Rank Table */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-4">
            <RankTable
              items={tableItems}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
    </div>
  )
}
