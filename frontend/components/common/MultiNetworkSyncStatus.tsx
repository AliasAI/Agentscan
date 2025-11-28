'use client'

import { useState, useRef, useEffect } from 'react'
import type { MultiNetworkSyncStatus as MultiNetworkSyncStatusType } from '@/types'
import { NetworkIcon } from './NetworkIcons'

interface Props {
  syncStatus: MultiNetworkSyncStatusType
}

export function MultiNetworkSyncStatus({ syncStatus }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeNetworks = syncStatus.networks.filter(n => n.sync_progress > 0)
  const syncedCount = syncStatus.networks.filter(n => n.sync_progress >= 99.9).length
  const totalCount = syncStatus.networks.length

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Compact Status Badge */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#e5e5e5] dark:border-[#333] text-xs hover:border-[#d4d4d4] dark:hover:border-[#404040] transition-colors"
      >
        {/* Status indicator */}
        {syncStatus.is_syncing ? (
          <div className="relative flex items-center justify-center w-4 h-4">
            <div className="absolute w-2 h-2 bg-blue-500 rounded-full animate-ping opacity-75"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        ) : (
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        )}

        {/* Network icons - show up to 4 */}
        <div className="flex items-center -space-x-1">
          {activeNetworks.slice(0, 4).map((network) => (
            <div
              key={network.network_key}
              className="w-4 h-4 rounded-full ring-1 ring-white dark:ring-[#1a1a1a] overflow-hidden"
            >
              <NetworkIcon networkName={network.network_name} className="w-4 h-4" />
            </div>
          ))}
          {activeNetworks.length > 4 && (
            <div className="w-4 h-4 rounded-full bg-[#f5f5f5] dark:bg-[#333] ring-1 ring-white dark:ring-[#1a1a1a] flex items-center justify-center">
              <span className="text-[9px] font-medium text-[#737373]">+{activeNetworks.length - 4}</span>
            </div>
          )}
        </div>

        {/* Sync count */}
        <span className="text-[#525252] dark:text-[#a3a3a3] font-medium">
          {syncedCount}/{totalCount}
        </span>

        {/* Chevron */}
        <svg
          className={`w-3 h-3 text-[#a3a3a3] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#1a1a1a] rounded-lg border border-[#e5e5e5] dark:border-[#333] shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[#f5f5f5] dark:border-[#262626] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
              Sync Status
            </span>
            <span className="text-[10px] text-[#737373] dark:text-[#737373]">
              {syncStatus.overall_progress.toFixed(0)}% overall
            </span>
          </div>

          {/* Network list */}
          <div className="max-h-72 overflow-y-auto">
            {syncStatus.networks.map((network) => {
              const isSynced = network.sync_progress >= 99.9
              const blocksBehind = network.latest_block - network.current_block

              return (
                <div
                  key={network.network_key}
                  className="px-3 py-2 flex items-center gap-2.5 hover:bg-[#fafafa] dark:hover:bg-[#262626] transition-colors"
                >
                  {/* Network icon */}
                  <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                    <NetworkIcon networkName={network.network_name} className="w-5 h-5" />
                  </div>

                  {/* Network info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#0a0a0a] dark:text-[#fafafa] truncate">
                        {network.network_name}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {network.is_syncing ? (
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        ) : isSynced ? (
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        ) : (
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                        )}
                        <span className={`text-[10px] font-medium ${
                          isSynced
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[#737373]'
                        }`}>
                          {network.sync_progress.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {/* Block info - only show if not fully synced */}
                    {!isSynced && blocksBehind > 0 && (
                      <div className="text-[10px] text-[#a3a3a3] dark:text-[#737373] mt-0.5">
                        {blocksBehind.toLocaleString()} blocks behind
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
