import type { AgentCapability, AgentEcosystemLink } from '@/types';

const ecosystemStyles: Record<string, string> = {
  virtuals_acp: 'bg-[#eff6ff] text-[#2563eb] dark:bg-[#172554] dark:text-[#93c5fd]',
  bnbagent: 'bg-[#fef3c7] text-[#b45309] dark:bg-[#451a03] dark:text-[#fcd34d]',
  coinbase: 'bg-[#ecfeff] text-[#0f766e] dark:bg-[#042f2e] dark:text-[#99f6e4]',
};

const capabilityStyles: Record<string, string> = {
  acp: 'bg-[#f5f3ff] text-[#6d28d9] dark:bg-[#2e1065] dark:text-[#d8b4fe]',
  x402: 'bg-[#ecfccb] text-[#4d7c0f] dark:bg-[#1a2e05] dark:text-[#bef264]',
  agentkit: 'bg-[#dbeafe] text-[#1d4ed8] dark:bg-[#172554] dark:text-[#93c5fd]',
  erc8183: 'bg-[#ffe4e6] text-[#be123c] dark:bg-[#4c0519] dark:text-[#fda4af]',
  payable: 'bg-[#ecfdf5] text-[#047857] dark:bg-[#052e16] dark:text-[#86efac]',
};

const ecosystemLabels: Record<string, string> = {
  virtuals_acp: 'Virtuals ACP',
  bnbagent: 'BNB Agent',
  coinbase: 'Coinbase',
};

const capabilityLabels: Record<string, string> = {
  acp: 'ACP',
  x402: 'x402',
  agentkit: 'AgentKit',
  erc8183: 'ERC-8183',
  payable: 'Payable',
};

interface EcosystemBadgesProps {
  ecosystems?: AgentEcosystemLink[];
  capabilities?: AgentCapability[];
  tokenId?: number | null;
  agentWallet?: string | null;
  isActive?: boolean | null;
  compact?: boolean;
}

export function EcosystemBadges({
  ecosystems = [],
  capabilities = [],
  tokenId,
  agentWallet,
  isActive,
  compact = false,
}: EcosystemBadgesProps) {
  const ecosystemItems = ecosystems.slice(0, compact ? 2 : 6);
  const capabilityItems = capabilities.slice(0, compact ? 3 : 8);
  const registrySignals = [
    tokenId !== undefined && tokenId !== null
      ? { label: 'ERC-8004', className: 'bg-[#f4efe3] text-[#6a6047] dark:bg-[#1b1b1b] dark:text-[#b6a987]' }
      : null,
    agentWallet
      ? { label: 'Agent Wallet', className: 'bg-[#edf4ff] text-[#426899] dark:bg-[#132030] dark:text-[#8db7ff]' }
      : null,
    isActive === true
      ? { label: 'Active', className: 'bg-[#ecfdf5] text-[#047857] dark:bg-[#052e16] dark:text-[#86efac]' }
      : null,
  ].filter(Boolean) as Array<{ label: string; className: string }>;

  if (ecosystemItems.length === 0 && capabilityItems.length === 0 && registrySignals.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {registrySignals.map((signal) => (
        <span
          key={`registry-${signal.label}`}
          className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ${signal.className}`}
        >
          {signal.label}
        </span>
      ))}
      {ecosystemItems.map((ecosystem) => (
        <span
          key={`eco-${ecosystem.name}-${ecosystem.external_id ?? ecosystem.source_url ?? ''}`}
          className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ${ecosystemStyles[ecosystem.name] || 'bg-[#f5f5f5] text-[#525252] dark:bg-[#262626] dark:text-[#a3a3a3]'}`}
        >
          {ecosystemLabels[ecosystem.name] || ecosystem.name}
        </span>
      ))}
      {capabilityItems.map((capability) => (
        <span
          key={`cap-${capability.name}-${capability.source ?? ''}`}
          className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ${capabilityStyles[capability.name] || 'bg-[#f5f5f5] text-[#525252] dark:bg-[#262626] dark:text-[#a3a3a3]'}`}
        >
          {capabilityLabels[capability.name] || capability.name}
        </span>
      ))}
    </div>
  );
}
