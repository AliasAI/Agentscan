import type { Activity } from '@/types';
import { formatRelativeTime, formatAddress } from '@/lib/utils/format';

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  const activityIcons = {
    registered: '✨',
    reputation_update: '📊',
    validation_complete: '✅',
  };

  const activityLabels = {
    registered: 'New Agent Registered',
    reputation_update: 'Reputation Update',
    validation_complete: 'Validation Complete',
  };

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="text-sm flex-shrink-0">
            {activityIcons[activity.activity_type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-xs text-gray-900 dark:text-white truncate">
                {activityLabels[activity.activity_type]}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                {formatRelativeTime(activity.created_at)}
              </span>
            </div>
            {activity.agent && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {activity.agent.name}
                {activity.agent.token_id && ` (#${activity.agent.token_id})`}
              </p>
            )}
            {activity.tx_hash && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                Tx: {formatAddress(activity.tx_hash)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
