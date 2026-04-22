'use client'

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ecosystemService } from '@/lib/api/services';
import type { EcosystemSummaryItem } from '@/types';

const ECOSYSTEM_CONTENT: Record<string, { title: string; description: string; href: string }> = {
  virtuals_acp: {
    title: 'Virtuals ACP',
    description: 'Commerce, offerings, resources, and job-capable agents discovered through ACP.',
    href: '/ecosystems/virtuals-acp',
  },
  bnbagent: {
    title: 'BNB Agent',
    description: 'Execution and job-oriented agents connected to the BNB ecosystem.',
    href: '/agents?ecosystem=bnbagent',
  },
  coinbase: {
    title: 'Payments',
    description: 'Wallet-enabled and payable agents, including x402 and AgentKit capabilities.',
    href: '/agents?ecosystem=coinbase',
  },
};

export default function EcosystemsPageClient() {
  const [items, setItems] = useState<EcosystemSummaryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await ecosystemService.getSummary()
        setItems(response.items)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#737373]">
            Discovery Layer
          </p>
          <h1 className="mb-3 text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
            Ecosystems
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#525252] dark:text-[#a3a3a3]">
            Agentscan is expanding from ERC-8004 discovery into a routing layer for the
            agent economy. These ecosystem surfaces bring in commerce, execution, and
            payment capabilities under one query layer.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const content = ECOSYSTEM_CONTENT[item.ecosystem]
            if (!content) return null

            return (
              <Link
                key={item.ecosystem}
                href={content.href}
                className="group rounded-2xl border border-[#e5e5e5] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[#d4d4d4] hover:shadow-lg dark:border-[#262626] dark:bg-[#171717] dark:hover:border-[#404040]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                      {content.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#525252] dark:text-[#a3a3a3]">
                      {content.description}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#f5f5f5] px-2.5 py-1 text-[11px] font-medium text-[#525252] dark:bg-[#262626] dark:text-[#a3a3a3]">
                    {loading ? '...' : `${item.agent_count} agents`}
                  </span>
                </div>

                <div className="border-t border-[#f5f5f5] pt-4 text-xs text-[#737373] dark:border-[#1f1f1f] dark:text-[#737373]">
                  Capability signals: {loading ? '...' : item.capability_count}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
