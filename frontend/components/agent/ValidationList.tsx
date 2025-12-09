'use client'

import { useState, useEffect } from 'react'
import { feedbackService } from '@/lib/api/services'
import { formatAddress, formatDate } from '@/lib/utils/format'
import { useToast } from '@/components/common/Toast'
import type { Validation, ValidationListResponse, ValidationStatus } from '@/types'

interface ValidationListProps {
  agentId: string
  onCountChange?: (count: number) => void
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    COMPLETED: {
      bg: 'bg-[#f0fdf4] dark:bg-[#14532d]/30',
      text: 'text-[#22c55e] dark:text-[#4ade80]',
      label: 'Completed',
    },
    PENDING: {
      bg: 'bg-[#fefce8] dark:bg-[#422006]/30',
      text: 'text-[#eab308] dark:text-[#facc15]',
      label: 'Pending',
    },
    EXPIRED: {
      bg: 'bg-[#f5f5f5] dark:bg-[#262626]',
      text: 'text-[#737373]',
      label: 'Expired',
    },
  }

  const c = config[status] || config.PENDING

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'COMPLETED' ? 'bg-[#22c55e]' : status === 'PENDING' ? 'bg-[#eab308]' : 'bg-[#737373]'}`} />
      {c.label}
    </span>
  )
}

// Score display for validation response
function ValidationScore({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return (
      <span className="text-xs text-[#a3a3a3] dark:text-[#525252]">—</span>
    )
  }

  const getColor = () => {
    if (score >= 71) return 'text-[#22c55e] dark:text-[#4ade80]'
    if (score >= 41) return 'text-[#eab308] dark:text-[#facc15]'
    return 'text-[#ef4444] dark:text-[#f87171]'
  }

  return (
    <span className={`text-sm font-bold ${getColor()}`}>
      {score}
      <span className="text-[10px] font-normal text-[#a3a3a3] dark:text-[#525252]">/100</span>
    </span>
  )
}

// Pagination component (same as FeedbackList)
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = []
  const maxVisible = 5
  let start = Math.max(1, page - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages, start + maxVisible - 1)
  start = Math.max(1, end - maxVisible + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-[#f5f5f5] dark:border-[#1f1f1f]">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-1.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#525252] dark:text-[#a3a3a3]">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`
            min-w-[28px] h-7 px-2 rounded-md text-xs font-medium transition-colors
            ${p === page
              ? 'bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a]'
              : 'hover:bg-[#f5f5f5] dark:hover:bg-[#262626] text-[#525252] dark:text-[#a3a3a3]'
            }
          `}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="p-1.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#525252] dark:text-[#a3a3a3]">
          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}

// Single validation row
function ValidationRow({ validation }: { validation: Validation }) {
  const toast = useToast()

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(validation.validator_address)
      toast.success('Address copied!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="group py-3 transition-colors">
      <div className="flex items-center gap-4">
        {/* Validator icon */}
        <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-[#f5f5f5] to-[#e5e5e5] dark:from-[#262626] dark:to-[#171717] rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Validator address */}
            <button
              onClick={handleCopyAddress}
              className="font-mono text-xs text-[#0a0a0a] dark:text-[#fafafa] hover:text-[#525252] dark:hover:text-[#a3a3a3] transition-colors"
              title="Click to copy"
            >
              {formatAddress(validation.validator_address, 12)}
            </button>

            {/* Status badge */}
            <StatusBadge status={validation.status} />
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-3 text-[10px] text-[#a3a3a3] dark:text-[#525252]">
            <span>
              Requested: {validation.requested_at ? formatDate(validation.requested_at) : 'Unknown'}
            </span>
            {validation.completed_at && (
              <span>
                Completed: {formatDate(validation.completed_at)}
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="flex-shrink-0">
          <ValidationScore score={validation.response} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {validation.transaction_hash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${validation.transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
              title="View transaction"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3] hover:text-[#525252] dark:hover:text-[#a3a3a3]">
                <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// Empty state
function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 bg-[#f5f5f5] dark:bg-[#262626] rounded-xl flex items-center justify-center mx-auto mb-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3]">
          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-sm text-[#737373] dark:text-[#737373]">No validations yet</p>
      <p className="text-xs text-[#a3a3a3] dark:text-[#525252] mt-1">
        Third-party validations will appear here
      </p>
    </div>
  )
}

// Network not supported state
function NetworkNotSupportedState() {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 bg-[#fefce8] dark:bg-[#422006]/30 rounded-xl flex items-center justify-center mx-auto mb-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#eab308]">
          <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-sm text-[#737373] dark:text-[#737373]">Validation details not available</p>
      <p className="text-xs text-[#a3a3a3] dark:text-[#525252] mt-1 max-w-xs mx-auto">
        The subgraph for this network is not yet available. Validation data is indexed on-chain but detailed history cannot be queried at this time.
      </p>
    </div>
  )
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
          <div className="w-9 h-9 rounded-lg bg-[#f5f5f5] dark:bg-[#262626]" />
          <div className="flex-1">
            <div className="h-3 w-32 bg-[#f5f5f5] dark:bg-[#262626] rounded mb-2" />
            <div className="h-2 w-48 bg-[#f5f5f5] dark:bg-[#262626] rounded" />
          </div>
          <div className="h-5 w-12 bg-[#f5f5f5] dark:bg-[#262626] rounded" />
        </div>
      ))}
    </div>
  )
}

export function ValidationList({ agentId, onCountChange }: ValidationListProps) {
  const [data, setData] = useState<ValidationListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await feedbackService.getValidations(agentId, {
          page,
          page_size: 10,
        })
        setData(result)
        if (onCountChange) {
          onCountChange(result.total)
        }
      } catch (err) {
        console.error('Failed to fetch validations:', err)
        setError('Failed to load validations')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [agentId, page, onCountChange])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[#ef4444]">{error}</p>
        <button
          onClick={() => setPage(1)}
          className="mt-2 text-xs text-[#525252] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]"
        >
          Try again
        </button>
      </div>
    )
  }

  // Check if subgraph is not available for this network
  if (data && data.subgraph_available === false) {
    return <NetworkNotSupportedState />
  }

  if (!data || data.items.length === 0) {
    return <EmptyState />
  }

  return (
    <div>
      <div className="divide-y divide-[#f5f5f5] dark:divide-[#1f1f1f]">
        {data.items.map((validation) => (
          <ValidationRow key={validation.id} validation={validation} />
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={data.total_pages}
        onPageChange={setPage}
      />
    </div>
  )
}
