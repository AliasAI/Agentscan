import { NetworkIcon } from '@/components/common/NetworkIcons'

// Badge variants
function LiveBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium text-[#22c55e] bg-[#f0fdf4] dark:bg-[#14532d]/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
      {children}
    </span>
  )
}

function DraftBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium text-[#eab308] bg-[#fefce8] dark:bg-[#713f12]/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
      {children}
    </span>
  )
}

function ActiveBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium text-[#3b82f6] bg-[#eff6ff] dark:bg-[#1e3a5f]/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
      {children}
    </span>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-[#3b82f6] hover:text-[#2563eb] transition-colors"
    >
      {children}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 7H17V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  )
}

const LIFECYCLE_STEPS = ['Open', 'Funded', 'Submitted', 'Completed'] as const
const LIFECYCLE_ALT = ['Rejected', 'Expired'] as const

const PROTOCOLS = [
  {
    name: 'ERC-8004',
    badge: 'live' as const,
    accent: 'text-[#22c55e]',
    title: 'Agent Identity & Reputation',
    description: 'On-chain registry for AI agent identity, metadata, and verifiable reputation scores across multiple networks.',
  },
  {
    name: 'ERC-8183',
    badge: 'draft' as const,
    accent: 'text-[#eab308]',
    title: 'Agentic Commerce',
    description: 'Trustless job escrow between Client, Provider, and Evaluator — enabling autonomous agent-to-agent commerce.',
  },
  {
    name: 'x402',
    badge: 'active' as const,
    accent: 'text-[#3b82f6]',
    title: 'HTTP Micropayments',
    description: 'HTTP-native payment protocol using 402 status codes, enabling agents to pay for API calls with stablecoins.',
  },
] as const

const BADGE_MAP = {
  live: LiveBadge,
  draft: DraftBadge,
  active: ActiveBadge,
} as const

export default function ProtocolStackCard() {
  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#737373]">
          <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 12V12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
          Agentic Economy Stack
        </h2>
        <ActiveBadge>Ecosystem</ActiveBadge>
      </div>

      {/* 3-column protocol grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {PROTOCOLS.map((proto) => {
          const Badge = BADGE_MAP[proto.badge]
          return (
            <div
              key={proto.name}
              className="p-4 rounded-lg border border-[#f5f5f5] dark:border-[#1a1a1a] bg-[#fafafa] dark:bg-[#0a0a0a]/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold ${proto.accent}`}>{proto.name}</span>
                <Badge>{proto.badge === 'live' ? 'Live' : proto.badge === 'draft' ? 'Draft' : 'Active'}</Badge>
              </div>
              <div className="text-[13px] font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-1">
                {proto.title}
              </div>
              <p className="text-[11px] text-[#737373] leading-relaxed">
                {proto.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Job Lifecycle Flow */}
      <div className="mb-5">
        <div className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-2.5">
          ERC-8183 Job Lifecycle
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {LIFECYCLE_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#0a0a0a] dark:text-[#fafafa] px-2.5 py-1 rounded-full bg-[#f5f5f5] dark:bg-[#262626]">
                {step}
              </span>
              {i < LIFECYCLE_STEPS.length - 1 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#d4d4d4] dark:text-[#404040] shrink-0">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          ))}
          <span className="text-[11px] text-[#a3a3a3] mx-1">/</span>
          {LIFECYCLE_ALT.map((step) => (
            <span key={step} className="text-[11px] font-medium text-[#a3a3a3] px-2.5 py-1 rounded-full bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#262626]">
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Early Adopters */}
      <div className="mb-4">
        <div className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-2.5">
          Early Adopters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* BSC / BNBAgent SDK */}
          <div className="flex items-start gap-3 p-3 rounded-lg border border-[#f5f5f5] dark:border-[#1a1a1a] bg-[#fafafa] dark:bg-[#0a0a0a]/30">
            <div className="w-8 h-8 bg-white dark:bg-[#262626] rounded-lg flex items-center justify-center shrink-0">
              <NetworkIcon networkName="BNB Smart Chain" className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-medium text-[#0a0a0a] dark:text-[#fafafa]">BNBAgent SDK</span>
                <DraftBadge>Testnet</DraftBadge>
              </div>
              <p className="text-[11px] text-[#737373] mb-1.5">
                First ERC-8183 implementation by BSC — job posting, agent matching, and escrow settlement.
              </p>
              <ExternalLink href="https://www.bnbchain.org/en/blog/bnbagent-sdk-the-first-live-erc-8183-implementation-for-onchain-ai-agents">
                Announcement
              </ExternalLink>
            </div>
          </div>

          {/* Base / ThoughtProof */}
          <div className="flex items-start gap-3 p-3 rounded-lg border border-[#f5f5f5] dark:border-[#1a1a1a] bg-[#fafafa] dark:bg-[#0a0a0a]/30">
            <div className="w-8 h-8 bg-white dark:bg-[#262626] rounded-lg flex items-center justify-center shrink-0">
              <NetworkIcon networkName="Base" className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-medium text-[#0a0a0a] dark:text-[#fafafa]">ThoughtProof Evaluator</span>
                <LiveBadge>Mainnet</LiveBadge>
              </div>
              <p className="text-[11px] text-[#737373] mb-1.5">
                On-chain evaluator contract on Base — verifies agent task completion for ERC-8183 escrow.
              </p>
              <code className="text-[10px] font-mono text-[#525252] dark:text-[#a3a3a3]">
                Base Mainnet
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 border-t border-[#f5f5f5] dark:border-[#1a1a1a]">
        <ExternalLink href="https://eips.ethereum.org/EIPS/eip-8183">
          ERC-8183 Spec
        </ExternalLink>
        <ExternalLink href="https://ethereum-magicians.org/t/erc-8183-agentic-commerce/27902">
          Ethereum Magicians
        </ExternalLink>
        <ExternalLink href="https://www.bnbchain.org/en/blog/bnbagent-sdk-the-first-live-erc-8183-implementation-for-onchain-ai-agents">
          BNBAgent Blog
        </ExternalLink>
      </div>
    </div>
  )
}
