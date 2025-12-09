'use client'

import { useState, useEffect } from 'react'
import { feedbackService } from '@/lib/api/services'
import { formatAddress, formatDate } from '@/lib/utils/format'
import { useToast } from '@/components/common/Toast'
import type { Feedback, FeedbackListResponse } from '@/types'

interface FeedbackListProps {
  agentId: string
  onCountChange?: (count: number) => void
}

// Score ring component with color gradient
function ScoreRing({ score }: { score: number }) {
  const radius = 18
  const stroke = 3
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  // Color based on score
  const getColor = () => {
    if (score >= 71) return '#22c55e' // Green
    if (score >= 41) return '#eab308' // Yellow
    return '#ef4444' // Red
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-[#f5f5f5] dark:text-[#262626]"
        />
        {/* Score ring */}
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-500"
        />
      </svg>
      <span
        className="absolute text-xs font-bold"
        style={{ color: getColor() }}
      >
        {score}
      </span>
    </div>
  )
}

// Tag component
function Tag({ label, variant = 'default' }: { label: string; variant?: 'default' | 'revoked' }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium
        ${variant === 'revoked'
          ? 'bg-[#fef2f2] dark:bg-[#450a0a]/30 text-[#ef4444] dark:text-[#f87171]'
          : 'bg-[#f5f5f5] dark:bg-[#262626] text-[#525252] dark:text-[#a3a3a3]'
        }
      `}
    >
      {label}
    </span>
  )
}

// Pagination component
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

// Single feedback row
function FeedbackRow({ feedback }: { feedback: Feedback }) {
  const toast = useToast()
  const [expanded, setExpanded] = useState(false)

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(feedback.client_address)
      toast.success('Address copied!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div
      className={`
        group py-3 transition-colors
        ${feedback.is_revoked ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Score ring */}
        <div className="flex-shrink-0">
          <ScoreRing score={feedback.score} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Reviewer address */}
            <button
              onClick={handleCopyAddress}
              className="font-mono text-xs text-[#0a0a0a] dark:text-[#fafafa] hover:text-[#525252] dark:hover:text-[#a3a3a3] transition-colors"
              title="Click to copy"
            >
              {formatAddress(feedback.client_address, 12)}
            </button>

            {/* Revoked badge */}
            {feedback.is_revoked && (
              <Tag label="REVOKED" variant="revoked" />
            )}
          </div>

          {/* Timestamp */}
          <div className="text-[10px] text-[#a3a3a3] dark:text-[#525252]">
            {feedback.timestamp ? formatDate(feedback.timestamp) : 'Unknown time'}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {feedback.tag1 && <Tag label={feedback.tag1} />}
          {feedback.tag2 && <Tag label={feedback.tag2} />}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {feedback.feedback_uri && (
            <a
              href={
                feedback.feedback_uri.startsWith('ipfs://')
                  ? `https://ipfs.io/ipfs/${feedback.feedback_uri.slice(7)}`
                  : feedback.feedback_uri
              }
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
              title="View details on IPFS"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3] hover:text-[#525252] dark:hover:text-[#a3a3a3]">
                <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          )}
          {feedback.transaction_hash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${feedback.transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
              title="View transaction"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3] hover:text-[#525252] dark:hover:text-[#a3a3a3]">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 9H15M9 12H15M9 15H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-sm text-[#737373] dark:text-[#737373]">No reviews yet</p>
      <p className="text-xs text-[#a3a3a3] dark:text-[#525252] mt-1">
        Be the first to review this agent
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
      <p className="text-sm text-[#737373] dark:text-[#737373]">Review details not available</p>
      <p className="text-xs text-[#a3a3a3] dark:text-[#525252] mt-1 max-w-xs mx-auto">
        The subgraph for this network is not yet available. Review data is indexed on-chain but detailed history cannot be queried at this time.
      </p>
    </div>
  )
}

// Data source indicator
function DataSourceIndicator({ source }: { source: string }) {
  const isOnChain = source === 'on-chain'

  return (
    <div className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium mb-3
      ${isOnChain
        ? 'bg-[#fef3c7] dark:bg-[#78350f]/30 text-[#b45309] dark:text-[#fbbf24]'
        : 'bg-[#ecfdf5] dark:bg-[#064e3b]/30 text-[#059669] dark:text-[#34d399]'
      }
    `}>
      {isOnChain ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <path d="M21 12C21 16.9706 16.9706 21 12 21M21 12C21 7.02944 16.9706 3 12 3M21 12H3M12 21C7.02944 21 3 16.9706 3 12M12 21C13.6569 21 15 16.9706 15 12C15 7.02944 13.6569 3 12 3M12 21C10.3431 21 9 16.9706 9 12C9 7.02944 10.3431 3 12 3M3 12C3 7.02944 7.02944 3 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>On-Chain Data</span>
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 9L13 14L9 10L4 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Subgraph Data</span>
        </>
      )}
    </div>
  )
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-[#f5f5f5] dark:bg-[#262626]" />
          <div className="flex-1">
            <div className="h-3 w-32 bg-[#f5f5f5] dark:bg-[#262626] rounded mb-2" />
            <div className="h-2 w-24 bg-[#f5f5f5] dark:bg-[#262626] rounded" />
          </div>
          <div className="h-5 w-16 bg-[#f5f5f5] dark:bg-[#262626] rounded" />
        </div>
      ))}
    </div>
  )
}

export function FeedbackList({ agentId, onCountChange }: FeedbackListProps) {
  const [data, setData] = useState<FeedbackListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await feedbackService.getFeedbacks(agentId, {
          page,
          page_size: 10,
        })
        setData(result)
        if (onCountChange) {
          onCountChange(result.total)
        }
      } catch (err) {
        console.error('Failed to fetch feedbacks:', err)
        setError('Failed to load reviews')
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

  // Check if subgraph is not available AND no on-chain data either
  // If data_source is 'on-chain', we have fallback data to show
  if (data && data.subgraph_available === false && data.data_source !== 'on-chain') {
    return <NetworkNotSupportedState />
  }

  if (!data || data.items.length === 0) {
    return <EmptyState />
  }

  const dataSource = data.data_source || 'subgraph'

  return (
    <div>
      {/* Show data source indicator for on-chain data */}
      {dataSource === 'on-chain' && (
        <DataSourceIndicator source={dataSource} />
      )}

      <div className="divide-y divide-[#f5f5f5] dark:divide-[#1f1f1f]">
        {data.items.map((feedback) => (
          <FeedbackRow key={feedback.id} feedback={feedback} />
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
