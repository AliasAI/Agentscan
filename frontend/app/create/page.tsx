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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-2">
            Create Agent
          </h1>
          <p className="text-sm text-[#525252] dark:text-[#a3a3a3]">
            Register a new AI agent on the ERC-8004 protocol
          </p>
        </div>

        {/* Connection prompt (shown when wallet not connected) */}
        {!isConnected ? (
          <div className="max-w-md mx-auto p-8 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626]">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-[#f5f5f5] dark:bg-[#262626] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-sm text-[#737373] mb-4">
                Connect your wallet to create an agent. You&apos;ll need some ETH for gas fees.
              </p>
              <WalletButton />
            </div>
          </div>
        ) : (
          /* Two-column layout (form left, info right) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Network selector */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626]">
                <div>
                  <p className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa]">Network</p>
                  <p className="text-xs text-[#737373]">Select the network to deploy your agent</p>
                </div>
                <NetworkSwitcher />
              </div>

              {/* Agent form */}
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6">
                <AgentForm />
              </div>
            </div>

            {/* Right: Sidebar info */}
            <div className="space-y-6">
              <div className="sticky top-20">
                {/* About ERC-8004 */}
                <div className="p-5 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] mb-6">
                  <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-3">
                    About ERC-8004
                  </h3>
                  <p className="text-xs text-[#737373] leading-relaxed mb-4">
                    ERC-8004 is an open standard for registering AI agents on Ethereum. Each agent is
                    an NFT with metadata on IPFS, including endpoint URLs, skills, and domains.
                  </p>
                  <div className="flex flex-col gap-2">
                    <a href="https://eips.ethereum.org/EIPS/eip-8004" target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      ERC-8004 Specification
                    </a>
                    <a href="https://github.com/agntcy/oasf" target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      OASF Standard
                    </a>
                    <a href="https://github.com/erc-8004/best-practices" target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      Registration Best Practices
                    </a>
                  </div>
                </div>

                {/* Quick tips */}
                <div className="p-5 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626]">
                  <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-3">
                    Tips
                  </h3>
                  <ul className="space-y-2.5 text-xs text-[#737373] leading-relaxed">
                    <li className="flex gap-2">
                      <span className="text-green-500 shrink-0 mt-0.5">1.</span>
                      A clear name and description improve discoverability
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500 shrink-0 mt-0.5">2.</span>
                      Add services to define your agent&apos;s capabilities
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500 shrink-0 mt-0.5">3.</span>
                      You can update metadata later via setAgentURI
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500 shrink-0 mt-0.5">4.</span>
                      Gas fees vary by network — Base is often cheapest
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
