'use client'

import { useState } from 'react'
import { useToast } from '@/components/common/Toast'

// Info row component for consistent styling in detail pages
export function InfoRow({
  label,
  value,
  action,
  isLast = false,
}: {
  label: string
  value: React.ReactNode
  action?: React.ReactNode
  isLast?: boolean
}) {
  return (
    <div className={`flex justify-between items-start py-3 ${!isLast ? 'border-b border-[#f5f5f5] dark:border-[#1f1f1f]' : ''}`}>
      <span className="text-xs text-[#737373] dark:text-[#737373] font-medium">{label}</span>
      <div className="flex items-center gap-2 text-right">
        <span className="text-sm text-[#0a0a0a] dark:text-[#fafafa]">{value}</span>
        {action}
      </div>
    </div>
  )
}

// Copy button component
export function CopyButton({ text, label }: { text: string; label: string }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${label} copied!`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#22c55e]">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#a3a3a3] hover:text-[#525252] dark:hover:text-[#a3a3a3]">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )}
    </button>
  )
}

// Status configuration for agent states
export const statusConfig = {
  active: {
    bg: 'bg-[#f0fdf4] dark:bg-[#14532d]/30',
    text: 'text-[#22c55e] dark:text-[#4ade80]',
    dot: 'bg-[#22c55e]',
    label: 'Active',
  },
  inactive: {
    bg: 'bg-[#f5f5f5] dark:bg-[#262626]',
    text: 'text-[#737373]',
    dot: 'bg-[#737373]',
    label: 'Inactive',
  },
  validating: {
    bg: 'bg-[#fefce8] dark:bg-[#422006]/30',
    text: 'text-[#eab308] dark:text-[#facc15]',
    dot: 'bg-[#eab308]',
    label: 'Validating',
  },
}

// Sync status configuration
export const syncStatusConfig = {
  syncing: {
    bg: 'bg-[#f5f5f5] dark:bg-[#262626]',
    text: 'text-[#525252] dark:text-[#a3a3a3]',
    label: 'Syncing',
  },
  synced: {
    bg: 'bg-[#f0fdf4] dark:bg-[#14532d]/30',
    text: 'text-[#22c55e] dark:text-[#4ade80]',
    label: 'Synced',
  },
  failed: {
    bg: 'bg-[#fef2f2] dark:bg-[#450a0a]/30',
    text: 'text-[#ef4444] dark:text-[#f87171]',
    label: 'Failed',
  },
}

// Verified Agent Badge
export function VerifiedBadge() {
  return (
    <div className="flex items-center justify-center gap-2 py-3 bg-[#f0fdf4] dark:bg-[#14532d]/30 rounded-lg">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#22c55e] dark:text-[#4ade80]">
        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-sm font-medium text-[#22c55e] dark:text-[#4ade80]">
        Verified Agent
      </span>
    </div>
  )
}

// Stats Grid with Reviews and Status
export function StatsGrid({
  reviewCount,
  statusLabel,
  statusTextClass
}: {
  reviewCount: number
  statusLabel: string
  statusTextClass: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-[#f5f5f5] dark:bg-[#0a0a0a] rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] text-[#737373] uppercase tracking-wide">Reviews</span>
        </div>
        <span className="text-lg font-bold text-[#0a0a0a] dark:text-[#fafafa]">
          {reviewCount}
        </span>
      </div>
      <div className="bg-[#f5f5f5] dark:bg-[#0a0a0a] rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] text-[#737373] uppercase tracking-wide">Status</span>
        </div>
        <span className={`text-sm font-bold ${statusTextClass}`}>
          {statusLabel}
        </span>
      </div>
    </div>
  )
}
