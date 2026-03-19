'use client'

import { useState } from 'react'

const SHARED_CONTRACTS = {
  identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
}

function CopyableAddress({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="group/addr flex items-center gap-3 py-2">
      <span className="text-[11px] font-medium text-[#737373] w-36 shrink-0">{label}</span>
      <code className="font-mono text-[11px] text-[#525252] dark:text-[#a3a3a3] truncate flex-1 min-w-0">
        {address}
      </code>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(address)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        className="opacity-0 group-hover/addr:opacity-100 p-1.5 hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded transition-all shrink-0"
        title="Copy address"
      >
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#22c55e]">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )}
      </button>
    </div>
  )
}

export default function ContractsCard() {
  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
      <div className="flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
          ERC-8004 Registry Contracts
        </h2>
        <span className="text-[10px] font-medium text-[#22c55e] bg-[#f0fdf4] dark:bg-[#14532d]/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
          CREATE2
        </span>
      </div>
      <p className="text-xs text-[#737373] mb-4">
        All networks share the same contract addresses via CREATE2 deterministic deployment.
      </p>
      <div className="divide-y divide-[#f5f5f5] dark:divide-[#262626]">
        <CopyableAddress label="Identity Registry" address={SHARED_CONTRACTS.identity} />
        <CopyableAddress label="Reputation Registry" address={SHARED_CONTRACTS.reputation} />
      </div>
    </div>
  )
}
