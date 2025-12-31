'use client'

/**
 * NetworkSwitcher - Switch between supported networks
 *
 * Features:
 * - Show current network
 * - List all supported networks
 * - Switch network on click
 * - Highlight unsupported network warning
 */

import { useChainId, useSwitchChain, useAccount } from 'wagmi'
import { useState, useRef, useEffect } from 'react'
import { chains, chainNames, isSupportedChain } from '@/lib/web3/config'

interface NetworkSwitcherProps {
  className?: string
}

export function NetworkSwitcher({ className = '' }: NetworkSwitcherProps) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isConnected) return null

  const currentNetwork = chainNames[chainId] || 'Unknown'
  const isSupported = isSupportedChain(chainId)

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                   transition-colors ${
                     isSupported
                       ? 'bg-[#f5f5f5] dark:bg-[#262626] hover:bg-[#e5e5e5] dark:hover:bg-[#333]'
                       : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                   }`}
      >
        {/* Network indicator */}
        <span
          className={`w-2 h-2 rounded-full ${
            isSupported ? 'bg-green-500' : 'bg-orange-500 animate-pulse'
          }`}
        />
        <span>{currentNetwork}</span>
        <svg
          className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Network dropdown */}
      {showMenu && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-lg
                     shadow-lg border border-[#e5e5e5] dark:border-[#333] py-1 z-50"
        >
          <div className="px-3 py-2 border-b border-[#e5e5e5] dark:border-[#333]">
            <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">
              Select Network
            </p>
          </div>

          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => {
                switchChain({ chainId: chain.id })
                setShowMenu(false)
              }}
              disabled={isPending || chain.id === chainId}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2
                         transition-colors disabled:cursor-not-allowed
                         ${
                           chain.id === chainId
                             ? 'bg-[#f5f5f5] dark:bg-[#262626] text-[#0a0a0a] dark:text-[#fafafa]'
                             : 'hover:bg-[#f5f5f5] dark:hover:bg-[#262626] text-[#6e6e73] dark:text-[#86868b]'
                         }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  chain.id === chainId ? 'bg-green-500' : 'bg-[#d4d4d4] dark:bg-[#525252]'
                }`}
              />
              <span className="flex-1">{chain.name}</span>
              {chain.id === chainId && (
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * NetworkWarning - Show warning when on unsupported network
 */
export function NetworkWarning() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  if (!isConnected || isSupportedChain(chainId)) return null

  return (
    <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
            Unsupported Network
          </h3>
          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
            Please switch to a supported network to create an agent.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {chains.slice(0, 3).map((chain) => (
              <button
                key={chain.id}
                onClick={() => switchChain({ chainId: chain.id })}
                className="px-3 py-1 text-xs font-medium bg-orange-200 dark:bg-orange-800
                         text-orange-800 dark:text-orange-200 rounded-md
                         hover:bg-orange-300 dark:hover:bg-orange-700 transition-colors"
              >
                Switch to {chain.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
