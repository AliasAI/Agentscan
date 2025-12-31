'use client'

/**
 * Create Agent Page
 *
 * Allows users to create ERC-8004 agents with:
 * - Wallet connection
 * - Network selection
 * - OASF metadata configuration
 * - IPFS upload
 * - On-chain registration
 */

import { useAccount } from 'wagmi'
import { AgentForm } from '@/components/create/AgentForm'
import { WalletButton } from '@/components/web3/WalletButton'
import { NetworkSwitcher } from '@/components/web3/NetworkSwitcher'

export default function CreateAgentPage() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-2">
            Create Agent
          </h1>
          <p className="text-sm text-[#6e6e73] dark:text-[#86868b]">
            Register a new AI agent on the ERC-8004 protocol. Your agent will be discoverable and
            verifiable on-chain.
          </p>
        </div>

        {/* Connection status */}
        {!isConnected && (
          <div className="mb-6 p-6 bg-white dark:bg-[#1a1a1a] rounded-xl border border-[#e5e5e5] dark:border-[#333]">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-[#f5f5f5] dark:bg-[#262626] rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#6e6e73] dark:text-[#86868b]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-sm text-[#6e6e73] dark:text-[#86868b] mb-4">
                Connect your wallet to create an agent. You&apos;ll need some testnet ETH for gas fees.
              </p>
              <WalletButton />
            </div>
          </div>
        )}

        {/* Network selector (when connected) */}
        {isConnected && (
          <div className="mb-6 flex items-center justify-between p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-[#e5e5e5] dark:border-[#333]">
            <div>
              <p className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa]">Network</p>
              <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">
                Select the network to deploy your agent
              </p>
            </div>
            <NetworkSwitcher />
          </div>
        )}

        {/* Agent form */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-[#e5e5e5] dark:border-[#333] p-6">
          <AgentForm />
        </div>

        {/* Info section */}
        <div className="mt-8 p-4 bg-[#f5f5f5] dark:bg-[#1a1a1a] rounded-lg">
          <h3 className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-2">
            About ERC-8004
          </h3>
          <p className="text-xs text-[#6e6e73] dark:text-[#86868b] leading-relaxed">
            ERC-8004 is an open standard for registering AI agents on Ethereum. Each agent is
            represented as an NFT with associated metadata stored on IPFS. The metadata includes
            endpoint URLs, capabilities (skills), and application domains following the Open Agent
            Service Framework (OASF).
          </p>
          <div className="mt-3 flex gap-4">
            <a
              href="https://eips.ethereum.org/EIPS/eip-8004"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              ERC-8004 Specification
            </a>
            <a
              href="https://github.com/agntcy/oasf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              OASF Standard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
