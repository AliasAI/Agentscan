'use client'

/**
 * WalletButton - Connect/disconnect wallet with network info
 *
 * Features:
 * - Connect wallet button (MetaMask, etc.)
 * - Display connected address (truncated)
 * - Show current network with indicator
 * - Dropdown menu for disconnect
 */

import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { useState, useRef, useEffect } from 'react'
import { chainNames, isSupportedChain } from '@/lib/web3/config'

export function WalletButton() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
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

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isConnecting}
        className="px-4 py-2 bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a]
                   text-sm font-medium rounded-lg hover:opacity-90 transition-opacity
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  // Connected - show address and network
  const truncatedAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`
  const networkName = chainNames[chainId] || 'Unknown'
  const isSupported = isSupportedChain(chainId)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 bg-[#f5f5f5] dark:bg-[#262626]
                   rounded-lg text-sm font-medium hover:bg-[#e5e5e5] dark:hover:bg-[#333]
                   transition-colors"
      >
        {/* Network indicator */}
        <span
          className={`w-2 h-2 rounded-full ${
            isSupported ? 'bg-green-500' : 'bg-orange-500'
          }`}
        />
        {/* Address */}
        <span className="text-[#0a0a0a] dark:text-[#fafafa]">
          {truncatedAddress}
        </span>
        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-[#6e6e73] transition-transform ${
            showMenu ? 'rotate-180' : ''
          }`}
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

      {/* Dropdown menu */}
      {showMenu && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-lg
                     shadow-lg border border-[#e5e5e5] dark:border-[#333] py-1 z-50"
        >
          {/* Network info */}
          <div className="px-4 py-2 border-b border-[#e5e5e5] dark:border-[#333]">
            <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">Network</p>
            <p
              className={`text-sm font-medium ${
                isSupported
                  ? 'text-[#0a0a0a] dark:text-[#fafafa]'
                  : 'text-orange-500'
              }`}
            >
              {networkName}
              {!isSupported && ' (Unsupported)'}
            </p>
          </div>

          {/* Disconnect button */}
          <button
            onClick={() => {
              disconnect()
              setShowMenu(false)
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-500
                       hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
