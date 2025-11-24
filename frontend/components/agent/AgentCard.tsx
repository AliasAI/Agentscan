import Link from 'next/link';
import type { Agent } from '@/types';
import { formatAddress } from '@/lib/utils/format';
import { NetworkIcon } from '@/components/common/NetworkIcons';
import { OASFTags } from './OASFTags';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    validating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    validating: 'Validating',
  };

  return (
    <Link href={`/agents/${agent.id}`} className="block group h-full">
      <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer h-full flex flex-col hover:-translate-y-0.5 overflow-hidden">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Header: Name + Status */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {agent.name}
              </h3>
              {agent.token_id !== undefined && agent.token_id !== null && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono flex-shrink-0">
                  #{agent.token_id}
                </span>
              )}
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${statusColors[agent.status]}`}
            >
              {statusLabels[agent.status]}
            </span>
          </div>

          {/* Network + Address */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
            {agent.network_name && (
              <>
                <div className="flex items-center gap-1" title={agent.network_name}>
                  <NetworkIcon networkName={agent.network_name} className="w-3.5 h-3.5" />
                  <span>{agent.network_name}</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600">|</span>
              </>
            )}
            <span className="truncate font-mono text-[11px]">{formatAddress(agent.address)}</span>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 leading-relaxed flex-grow">
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

          {/* Reputation Footer */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-700/50 mt-auto">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Reputation</span>
            </div>
            <div>
              {agent.reputation_count && agent.reputation_count > 0 ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {agent.reputation_score.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    ({agent.reputation_count})
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  No reviews yet
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
