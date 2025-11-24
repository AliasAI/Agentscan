'use client'

import { useState } from 'react'
import { formatNumber } from '@/lib/utils/format'
import type { MultiNetworkSyncStatus as MultiNetworkSyncStatusType } from '@/types'
import { NetworkIcon } from './NetworkIcons'

interface Props {
  syncStatus: MultiNetworkSyncStatusType
}

export function MultiNetworkSyncStatus({ syncStatus }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  const activeNetworks = syncStatus.networks.filter(n => n.sync_progress > 0)

  return (
    <div className="relative">
      {/* Main Status Badge */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          {syncStatus.is_syncing ? (
            <>
              <div className="relative">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping absolute"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Syncing
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Synced
              </span>
            </>
          )}
        </div>
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          {syncStatus.overall_progress.toFixed(1)}%
        </span>
        <div className="flex items-center gap-1">
          {activeNetworks.slice(0, 3).map((network) => (
            <NetworkIcon
              key={network.network_key}
              networkName={network.network_name}
              className="w-4 h-4"
            />
          ))}
          {activeNetworks.length > 3 && (
            <span className="text-xs text-gray-500">+{activeNetworks.length - 3}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Network Details */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Network Sync Status
            </h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {syncStatus.networks.map((network) => (
              <div
                key={network.network_key}
                className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <NetworkIcon networkName={network.network_name} className="w-5 h-5" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {network.network_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {network.is_syncing ? (
                      <div className="relative">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping absolute"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      </div>
                    ) : (
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    )}
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {network.sync_progress.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      network.sync_progress >= 100
                        ? 'bg-green-500'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, network.sync_progress)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Block {formatNumber(network.current_block)}</span>
                  <span>/ {formatNumber(network.latest_block)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
