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
    <Link href={`/agents/${agent.id}`} className="block group">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer min-h-[220px] flex flex-col hover:-translate-y-1 overflow-hidden">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {agent.name}
                </h3>
                {agent.token_id !== undefined && agent.token_id !== null && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono flex-shrink-0 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    #{agent.token_id}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                {agent.network_name && (
                  <>
                    <div className="flex items-center gap-1" title={agent.network_name}>
                      <NetworkIcon networkName={agent.network_name} className="w-4 h-4" />
                      <span className="text-xs">{agent.network_name}</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                  </>
                )}
                <span className="truncate font-mono text-xs">{formatAddress(agent.address)}</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusColors[agent.status]}`}
            >
              {statusLabels[agent.status]}
            </span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
            {agent.description}
          </p>

          <div className="mb-4">
            <OASFTags
              skills={agent.skills}
              domains={agent.domains}
              maxDisplay={3}
              classificationSource={agent.classification_source}
            />
          </div>

          <div className="flex items-center justify-between text-sm mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium">Reputation</span>
            </div>
            <div>
              {agent.reputation_count && agent.reputation_count > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {agent.reputation_score.toFixed(0)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    / 100 ({agent.reputation_count} {agent.reputation_count === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">
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
