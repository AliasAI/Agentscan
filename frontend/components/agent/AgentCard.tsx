import Link from 'next/link';
import type { Agent } from '@/types';
import { formatAddress } from '@/lib/utils/format';
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
    <Link href={`/agents/${agent.id}`}>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:shadow-lg transition-shadow cursor-pointer min-h-[200px] flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{agent.name}</h3>
              {agent.token_id !== undefined && agent.token_id !== null && (
                <span className="text-xs text-foreground/50 font-mono flex-shrink-0">
                  #{agent.token_id}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground/60 truncate">
              {formatAddress(agent.address)}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${statusColors[agent.status]}`}
          >
            {statusLabels[agent.status]}
          </span>
        </div>
        <p className="text-sm text-foreground/80 mb-2 line-clamp-2">
          {agent.description}
        </p>
        <OASFTags
          skills={agent.skills}
          domains={agent.domains}
          maxDisplay={3}
          classificationSource={agent.classification_source}
        />
        <div className="flex items-center justify-between text-sm mt-auto pt-3">
          <div className="text-foreground/60">
            Reputation
          </div>
          <div className="font-semibold">
            {agent.reputation_count && agent.reputation_count > 0 ? (
              <span>
                {agent.reputation_score.toFixed(0)}/100{' '}
                <span className="text-xs text-foreground/60 font-normal">
                  ({agent.reputation_count} {agent.reputation_count === 1 ? 'review' : 'reviews'})
                </span>
              </span>
            ) : (
              <span className="text-foreground/50 text-xs font-normal">
                No reviews yet
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
