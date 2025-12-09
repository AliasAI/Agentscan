import Link from 'next/link';
import type { Activity } from '@/types';
import { formatRelativeTime, formatAddress } from '@/lib/utils/format';

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  const getActivityConfig = (type: string) => {
    const configs: Record<string, { icon: React.ReactNode; label: string; dotColor: string }> = {
      registered: {
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-emerald-500">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        label: 'New Agent Registered',
        dotColor: 'bg-emerald-500',
      },
      reputation_update: {
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-amber-500">
            <path d="M12 20V10M18 20V4M6 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        label: 'Reputation Updated',
        dotColor: 'bg-amber-500',
      },
      validation_complete: {
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-sky-500">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        label: 'Validation Complete',
        dotColor: 'bg-sky-500',
      },
    };
    return configs[type] || configs.registered;
  };

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const config = getActivityConfig(activity.activity_type);

        return (
          <Link
            key={activity.id}
            href={`/agents/${activity.agent_id}`}
            className="
              group flex items-start gap-3 p-2.5 -mx-1 rounded-lg
              hover:bg-[#f5f5f5] dark:hover:bg-[#1f1f1f]
              transition-colors duration-150
            "
          >
            {/* Icon with status dot */}
            <div className="relative flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center group-hover:bg-[#e5e5e5] dark:group-hover:bg-[#333] transition-colors">
                {config.icon}
              </div>
              {/* Status dot */}
              <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${config.dotColor} ring-2 ring-white dark:ring-[#171717]`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Activity type label */}
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-xs font-medium text-[#0a0a0a] dark:text-[#fafafa] truncate">
                  {config.label}
                </span>
                <span className="text-[10px] text-[#a3a3a3] dark:text-[#525252] flex-shrink-0">
                  {formatRelativeTime(activity.created_at)}
                </span>
              </div>

              {/* Agent name */}
              {activity.agent && (
                <p className="text-[11px] text-[#525252] dark:text-[#a3a3a3] truncate mb-0.5">
                  {activity.agent.name}
                  {activity.agent.token_id && (
                    <span className="text-[#a3a3a3] dark:text-[#525252]"> #{activity.agent.token_id}</span>
                  )}
                </p>
              )}

              {/* Transaction hash */}
              {activity.tx_hash && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#a3a3a3] dark:text-[#525252] font-mono">
                    tx: {formatAddress(activity.tx_hash)}
                  </span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-[#d4d4d4] dark:text-[#404040] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <path d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
