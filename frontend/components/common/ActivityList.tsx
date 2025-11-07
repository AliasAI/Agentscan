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
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="text-2xl">
            {activityIcons[activity.activity_type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">
                {activityLabels[activity.activity_type]}
              </span>
              <span className="text-xs text-foreground/60">
                {formatRelativeTime(activity.created_at)}
              </span>
            </div>
            <p className="text-sm text-foreground/80">
              {activity.description}
            </p>
            {activity.tx_hash && (
              <p className="text-xs text-foreground/60 mt-1">
                Tx: {formatAddress(activity.tx_hash)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
