import Link from 'next/link';
import type { Agent } from '@/types';
import { formatAddress } from '@/lib/utils/format';
import { NetworkIcon } from '@/components/common/NetworkIcons';
import { OASFTags } from './OASFTags';
import { ScoreRing, EmptyScoreRing } from './ScoreRing';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  // 统一的状态配色 - 黑白灰科技风格
  const statusColors = {
    active: 'bg-[#f0fdf4] text-[#22c55e] dark:bg-[#14532d]/30 dark:text-[#4ade80]',
    inactive: 'bg-[#f5f5f5] text-[#737373] dark:bg-[#262626] dark:text-[#737373]',
    validating: 'bg-[#fefce8] text-[#eab308] dark:bg-[#422006]/30 dark:text-[#facc15]',
  };

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    validating: 'Validating',
  };

  return (
    <Link href={`/agents/${agent.id}`} className="block group h-full">
      <div className="relative bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626] p-4 hover:border-[#d4d4d4] dark:hover:border-[#404040] hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col hover:-translate-y-0.5 overflow-hidden">
        <div className="relative z-10 flex flex-col h-full">
          {/* Header: Name + Status */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-[#0a0a0a] dark:text-[#fafafa] truncate group-hover:text-[#525252] dark:group-hover:text-[#d4d4d4] transition-colors">
                {agent.name}
              </h3>
              {agent.token_id !== undefined && agent.token_id !== null && (
                <span className="text-[10px] text-[#a3a3a3] dark:text-[#525252] font-mono flex-shrink-0">
                  #{agent.token_id}
                </span>
              )}
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${statusColors[agent.status]}`}
            >
              {statusLabels[agent.status]}
            </span>
          </div>

          {/* Network + Address */}
          <div className="flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#737373] mb-2">
            {agent.network_name && (
              <>
                <div className="flex items-center gap-1" title={agent.network_name}>
                  <NetworkIcon networkName={agent.network_name} className="w-3.5 h-3.5" />
                  <span>{agent.network_name}</span>
                </div>
                <span className="text-[#d4d4d4] dark:text-[#404040]">|</span>
              </>
            )}
            <span className="truncate font-mono text-[11px]">{formatAddress(agent.address)}</span>
          </div>

          {/* Description */}
          <p className="text-xs text-[#525252] dark:text-[#a3a3a3] mb-2 line-clamp-2 leading-relaxed flex-grow">
            {agent.description}
          </p>

          {/* OASF Tags */}
          <div className="mb-2">
            <OASFTags
              skills={agent.skills}
              domains={agent.domains}
              maxDisplay={3}
              classificationSource={agent.classification_source}
              compact
            />
          </div>

          {/* Trust Footer - Reviews & Validations */}
          <div className="flex items-center justify-between pt-3 border-t border-[#e5e5e5] dark:border-[#262626] mt-auto">
            {/* Score Ring or Empty State */}
            <div className="flex items-center gap-2">
              {agent.reputation_count && agent.reputation_count > 0 ? (
                <>
                  <ScoreRing score={agent.reputation_score} size={36} />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#737373] dark:text-[#737373] uppercase tracking-wide">
                      Trust Score
                    </span>
                    <span className="text-xs text-[#525252] dark:text-[#a3a3a3]">
                      {agent.reputation_count} {agent.reputation_count === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <EmptyScoreRing size={36} />
                  <span className="text-[10px] text-[#a3a3a3] dark:text-[#525252]">
                    No reviews yet
                  </span>
                </div>
              )}
            </div>

            {/* Validation Badge - Shows if agent has been validated */}
            {agent.status === 'active' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-[#f0fdf4] dark:bg-[#14532d]/30 rounded-md" title="Verified Agent">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#22c55e] dark:text-[#4ade80]">
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10px] font-medium text-[#22c55e] dark:text-[#4ade80]">
                  Verified
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
