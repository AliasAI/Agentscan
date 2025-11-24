'use client'

import { useState, useEffect, useRef } from 'react'
import { networkService } from '@/lib/api/services'
import type { NetworkWithStats } from '@/types'
import { NetworkIcon, DefaultNetworkIcon } from './NetworkIcons'

interface NetworkSelectorProps {
  selectedNetwork: string
  onNetworkChange: (networkId: string) => void
}

export function NetworkSelector({
  selectedNetwork,
  onNetworkChange,
}: NetworkSelectorProps) {
  const [networks, setNetworks] = useState<NetworkWithStats[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await networkService.getNetworksWithStats()
        setNetworks(data)
      } catch (error) {
        console.error('Failed to fetch networks:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNetworks()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const totalAgents = networks.reduce((sum, n) => sum + n.agent_count, 0)
  const selectedNetworkData = networks.find((n) => n.id === selectedNetwork)

  const renderSelectedDisplay = () => {
    if (selectedNetwork === 'all') {
      return (
        <>
          <DefaultNetworkIcon className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">All Networks ({totalAgents})</span>
        </>
      )
    }
    if (selectedNetworkData) {
      return (
        <>
          <NetworkIcon networkName={selectedNetworkData.name} className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{selectedNetworkData.name} ({selectedNetworkData.agent_count})</span>
        </>
      )
    }
    return <span>Select Network</span>
  }

  if (loading) {
    return (
      <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[180px]"
      >
        <span className="flex-1 text-left text-sm font-medium flex items-center gap-2">
          {renderSelectedDisplay()}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {/* All Networks Option */}
          <button
            onClick={() => {
              onNetworkChange('all')
              setIsOpen(false)
            }}
            className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
              selectedNetwork === 'all'
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : ''
            }`}
          >
            <span className="flex items-center gap-2">
              <DefaultNetworkIcon className="w-5 h-5" />
              <span className="font-medium">All Networks</span>
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalAgents} agents
            </span>
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Individual Networks - 只显示有 agents 的网络 */}
          {networks.filter((n) => n.agent_count > 0).map((network) => (
            <button
              key={network.id}
              onClick={() => {
                onNetworkChange(network.id)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                selectedNetwork === network.id
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : ''
              }`}
            >
              <span className="flex items-center gap-2">
                <NetworkIcon networkName={network.name} className="w-5 h-5" />
                <span className="font-medium">{network.name}</span>
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {network.agent_count} agents
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
