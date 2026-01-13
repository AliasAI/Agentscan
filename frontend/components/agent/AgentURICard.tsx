'use client'

import { useMemo } from 'react'
import { useToast } from '@/components/common/Toast'

interface AgentURICardProps {
  metadataUri: string
  onChainData?: Record<string, unknown>
  onPreview: () => void
}

export function AgentURICard({ metadataUri, onPreview }: AgentURICardProps) {
  const toast = useToast()

  // Detect URI type
  const uriType = useMemo(() => {
    if (!metadataUri) return 'NONE'
    if (metadataUri.startsWith('ipfs://')) return 'IPFS'
    if (metadataUri.startsWith('data:')) return 'DATA'
    if (metadataUri.startsWith('{') || metadataUri.startsWith('[')) return 'JSON'
    return 'HTTP'
  }, [metadataUri])

  // Resolve browser-accessible URL
  const browserUrl = useMemo(() => {
    if (!metadataUri) return ''
    if (metadataUri.startsWith('ipfs://')) {
      return `https://ipfs.io/ipfs/${metadataUri.slice(7)}`
    }
    if (metadataUri.startsWith('http')) {
      return metadataUri
    }
    return ''
  }, [metadataUri])

  // Truncate URI for display
  const displayUri = useMemo(() => {
    if (!metadataUri) return ''
    const maxLength = 70
    if (metadataUri.length > maxLength) {
      return metadataUri.slice(0, maxLength) + '...'
    }
    return metadataUri
  }, [metadataUri])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(metadataUri)
      toast.success('URI copied to clipboard!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  if (!metadataUri) return null

  // Protocol badge colors
  const badgeColors: Record<string, string> = {
    IPFS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    DATA: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    JSON: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    HTTP: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    NONE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }

  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[#525252] dark:text-[#a3a3a3]"
              >
                <path
                  d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                Agent URI
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                ERC-8004 Metadata Identifier
              </p>
            </div>
          </div>

          {/* Protocol badge */}
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${badgeColors[uriType]}`}>
            {uriType}
          </span>
        </div>
      </div>

      {/* URI Display */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-3 bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg p-3 border border-[#e5e5e5] dark:border-[#1f1f1f]">
          <code className="text-sm text-[#525252] dark:text-[#a3a3a3] font-mono break-all flex-1 leading-relaxed">
            {displayUri}
          </code>
          <button
            onClick={copyToClipboard}
            className="flex-shrink-0 p-1.5 rounded-md hover:bg-[#e5e5e5] dark:hover:bg-[#262626] transition-colors"
            title="Copy URI"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[#737373]"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onPreview}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] hover:bg-[#262626] dark:hover:bg-[#e5e5e5] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
            Preview Metadata
          </button>

          {browserUrl && (
            <a
              href={browserUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#1f1f1f] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Open
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
