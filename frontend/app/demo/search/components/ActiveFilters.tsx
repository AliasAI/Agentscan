'use client';

import type { FilterState } from '../types';

interface ActiveFiltersProps {
  filters: FilterState;
  query: string;
  onClearFilter: (type: keyof FilterState, value?: string) => void;
  onClearQuery: () => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  filters,
  query,
  onClearFilter,
  onClearQuery,
  onClearAll,
}: ActiveFiltersProps) {
  // Check if any filters are active
  const hasActiveFilters =
    query ||
    filters.networks.length > 0 ||
    filters.skills.length > 0 ||
    filters.domains.length > 0 ||
    filters.status.length > 0 ||
    filters.reputationRange[0] > 0 ||
    filters.reputationRange[1] < 100 ||
    filters.createdTime;

  if (!hasActiveFilters) return null;

  // Format skill/domain name for display
  const formatTagName = (slug: string): string => {
    const name = slug.includes('/') ? slug.split('/').pop()! : slug;
    return name.replace(/_/g, ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-[#e5e5e5] dark:border-[#262626]">
      {/* Query Chip */}
      {query && (
        <FilterChip
          label={`"${query}"`}
          onRemove={onClearQuery}
          variant="query"
        />
      )}

      {/* Network Chips */}
      {filters.networks.map((network) => (
        <FilterChip
          key={network}
          label={network}
          onRemove={() => onClearFilter('networks', network)}
          variant="network"
        />
      ))}

      {/* Skill Chips */}
      {filters.skills.map((skill) => (
        <FilterChip
          key={skill}
          label={formatTagName(skill)}
          onRemove={() => onClearFilter('skills', skill)}
          variant="skill"
        />
      ))}

      {/* Domain Chips */}
      {filters.domains.map((domain) => (
        <FilterChip
          key={domain}
          label={formatTagName(domain)}
          onRemove={() => onClearFilter('domains', domain)}
          variant="domain"
        />
      ))}

      {/* Status Chips */}
      {filters.status.map((status) => (
        <FilterChip
          key={status}
          label={status.charAt(0).toUpperCase() + status.slice(1)}
          onRemove={() => onClearFilter('status', status)}
          variant="status"
        />
      ))}

      {/* Reputation Range Chip */}
      {(filters.reputationRange[0] > 0 || filters.reputationRange[1] < 100) && (
        <FilterChip
          label={`Rep: ${filters.reputationRange[0]}-${filters.reputationRange[1]}`}
          onRemove={() => onClearFilter('reputationRange')}
          variant="reputation"
        />
      )}

      {/* Created Time Chip */}
      {filters.createdTime && (
        <FilterChip
          label={
            filters.createdTime === '24h' ? 'Last 24h' :
            filters.createdTime === '7d' ? 'Last 7 days' :
            filters.createdTime === '30d' ? 'Last 30 days' : 'Custom'
          }
          onRemove={() => onClearFilter('createdTime')}
          variant="time"
        />
      )}

      {/* Clear All Button */}
      <button
        onClick={onClearAll}
        className="px-3 py-1.5 text-xs font-medium text-[#ef4444] hover:text-[#dc2626] hover:bg-[#fef2f2] dark:hover:bg-[#ef4444]/10 rounded-lg transition-all"
      >
        Clear All
      </button>
    </div>
  );
}

// Filter Chip Component
function FilterChip({
  label,
  onRemove,
  variant,
}: {
  label: string;
  onRemove: () => void;
  variant: 'query' | 'network' | 'skill' | 'domain' | 'status' | 'reputation' | 'time';
}) {
  const variantStyles = {
    query: 'bg-[#fef08a]/20 text-[#ca8a04] border-[#fef08a]',
    network: 'bg-[#0a0a0a]/5 text-[#0a0a0a] dark:bg-white/10 dark:text-white border-[#0a0a0a]/20 dark:border-white/20',
    skill: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30',
    domain: 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/30',
    status: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30',
    reputation: 'bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30',
    time: 'bg-[#06b6d4]/10 text-[#06b6d4] border-[#06b6d4]/30',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${variantStyles[variant]}`}>
      {/* Icon based on variant */}
      {variant === 'skill' && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )}
      {variant === 'domain' && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )}
      {variant === 'network' && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      )}

      {label}

      <button
        onClick={onRemove}
        className="ml-0.5 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
