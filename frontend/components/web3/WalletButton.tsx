'use client'

/**
 * WalletButton - Smart wallet connection with WalletConnect support
 *
 * Connection logic:
 * - Mobile (no window.ethereum): auto-use WalletConnect → deep link to wallet app
 * - Desktop (multiple connectors): show selection panel (browser wallet / WalletConnect)
 * - Single connector only: connect directly
 */

import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { useState, useRef, useEffect, useCallback } from 'react'
import { chainNames, isSupportedChain } from '@/lib/web3/config'

/** Check if browser has an injected wallet (MetaMask etc.) */
function hasInjectedWallet(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof window !== 'undefined' && !!(window as any).ethereum
}

export function WalletButton() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const [showMenu, setShowMenu] = useState(false)
  const [showConnectorPicker, setShowConnectorPicker] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Find connectors by type
  const injectedConnector = connectors.find((c) => c.type === 'injected')
  const wcConnector = connectors.find((c) => c.type === 'walletConnect')
  const hasMultipleOptions = !!injectedConnector && !!wcConnector

  // Close panels when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowMenu(false)
      }
      if (pickerRef.current && !pickerRef.current.contains(target)) {
        setShowConnectorPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /** Smart connect: auto-select on mobile, show picker on desktop with multiple options */
  const handleConnect = useCallback(() => {
    // Mobile without browser wallet → auto WalletConnect
    if (!hasInjectedWallet() && wcConnector) {
      connect({ connector: wcConnector })
      return
    }

    // Desktop with both options → show picker
    if (hasMultipleOptions) {
      setShowConnectorPicker(true)
      return
    }

    // Fallback: use first available connector
    if (connectors[0]) {
      connect({ connector: connectors[0] })
    }
  }, [connect, connectors, wcConnector, hasMultipleOptions])

  // ── Not connected ──
  if (!isConnected) {
    return (
      <div className="relative" ref={pickerRef}>
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-4 py-2 bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a]
                     text-sm font-medium rounded-lg hover:opacity-90 transition-opacity
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>

        {/* Connector picker panel (desktop with multiple connectors) */}
        {showConnectorPicker && (
          <div
            className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-xl
                       shadow-lg border border-[#e5e5e5] dark:border-[#333] py-2 z-50"
          >
            <p className="px-4 py-1.5 text-xs text-[#6e6e73] dark:text-[#86868b] font-medium">
              Select Connection
            </p>

            {/* Browser extension wallet */}
            {injectedConnector && (
              <button
                onClick={() => {
                  connect({ connector: injectedConnector })
                  setShowConnectorPicker(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm
                           text-[#0a0a0a] dark:text-[#fafafa]
                           hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-lg
                                 bg-[#f5f5f5] dark:bg-[#262626]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </span>
                <div>
                  <p className="font-medium">Browser Wallet</p>
                  <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">
                    MetaMask and other extensions
                  </p>
                </div>
              </button>
            )}

            {/* WalletConnect */}
            {wcConnector && (
              <button
                onClick={() => {
                  connect({ connector: wcConnector })
                  setShowConnectorPicker(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm
                           text-[#0a0a0a] dark:text-[#fafafa]
                           hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-lg
                                 bg-[#f5f5f5] dark:bg-[#262626]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                  </svg>
                </span>
                <div>
                  <p className="font-medium">WalletConnect</p>
                  <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">
                    Scan QR or mobile wallet
                  </p>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Connected ──
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
        <span
          className={`w-2 h-2 rounded-full ${
            isSupported ? 'bg-green-500' : 'bg-orange-500'
          }`}
        />
        <span className="text-[#0a0a0a] dark:text-[#fafafa]">
          {truncatedAddress}
        </span>
        <svg
          className={`w-4 h-4 text-[#6e6e73] transition-transform ${
            showMenu ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-lg
                     shadow-lg border border-[#e5e5e5] dark:border-[#333] py-1 z-50"
        >
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
