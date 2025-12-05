'use client';

import type { DemoAgent } from '../types';

interface ResultsGridProps {
  agents: DemoAgent[];
  viewMode: 'card' | 'list';
  query: string;
  selectedForCompare: string[];
  onToggleCompare: (agentId: string) => void;
}

export function ResultsGrid({
  agents,
  viewMode,
  query,
  selectedForCompare,
  onToggleCompare,
}: ResultsGridProps) {
  // Highlight matching text
  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="bg-[#fef08a] text-[#0a0a0a] rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Format tag name
  const formatTagName = (slug: string): string => {
    const name = slug.includes('/') ? slug.split('/').pop()! : slug;
    return name.replace(/_/g, ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#f5f5f5] dark:bg-[#171717] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-white mb-2">No agents found</h3>
        <p className="text-sm text-[#737373] max-w-md">
          Try adjusting your filters or search query to find what you're looking for.
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#f5f5f5] dark:bg-[#0a0a0a] border-b border-[#e5e5e5] dark:border-[#262626] text-xs font-medium text-[#737373] uppercase tracking-wide">
          <div className="col-span-1"></div>
          <div className="col-span-4">Agent</div>
          <div className="col-span-2">Network</div>
          <div className="col-span-2">Reputation</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        {agents.map((agent, index) => {
          const isSelected = selectedForCompare.includes(agent.id);
          return (
            <div
              key={agent.id}
              className={`grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-[#e5e5e5] dark:border-[#262626] last:border-b-0 hover:bg-[#f5f5f5] dark:hover:bg-[#0a0a0a] transition-colors cursor-pointer ${
                isSelected ? 'bg-[#fef08a]/10' : ''
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Checkbox */}
              <div className="col-span-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompare(agent.id);
                  }}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#0a0a0a] dark:border-white bg-[#0a0a0a] dark:bg-white'
                      : 'border-[#d4d4d4] dark:border-[#404040] hover:border-[#a3a3a3] dark:hover:border-[#525252]'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white dark:text-[#0a0a0a]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Agent Info */}
              <div className="col-span-4 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#0a0a0a] dark:text-white truncate">
                    {highlightText(agent.name, query)}
                  </span>
                  <span className="text-xs text-[#a3a3a3] font-mono">#{agent.tokenId}</span>
                </div>
                <p className="text-xs text-[#737373] truncate mt-0.5">
                  {highlightText(agent.description.slice(0, 80), query)}...
                </p>
              </div>

              {/* Network */}
              <div className="col-span-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#f5f5f5] dark:bg-[#262626] text-xs text-[#525252] dark:text-[#a3a3a3]">
                  <span>{agent.network === 'Base Sepolia' ? '🔷' : agent.network === 'Polygon Amoy' ? '🟣' : '🔵'}</span>
                  {agent.network}
                </span>
              </div>

              {/* Reputation */}
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-[#fbbf24]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    <span className="font-semibold text-[#0a0a0a] dark:text-white">{agent.reputationScore}</span>
                  </div>
                  <span className="text-xs text-[#a3a3a3]">({agent.reputationCount})</span>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                  agent.status === 'active'
                    ? 'bg-[#f0fdf4] text-[#22c55e] dark:bg-[#22c55e]/20'
                    : agent.status === 'validating'
                    ? 'bg-[#fefce8] text-[#eab308] dark:bg-[#eab308]/20'
                    : 'bg-[#f5f5f5] text-[#737373] dark:bg-[#262626]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    agent.status === 'active' ? 'bg-[#22c55e]' :
                    agent.status === 'validating' ? 'bg-[#eab308]' : 'bg-[#737373]'
                  }`} />
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end">
                <button className="p-2 text-[#737373] hover:text-[#0a0a0a] dark:hover:text-white hover:bg-[#e5e5e5] dark:hover:bg-[#262626] rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Card View
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent, index) => {
        const isSelected = selectedForCompare.includes(agent.id);
        return (
          <div
            key={agent.id}
            className={`group relative bg-white dark:bg-[#171717] rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer animate-fade-in-up ${
              isSelected
                ? 'border-[#0a0a0a] dark:border-white ring-2 ring-[#0a0a0a]/20 dark:ring-white/20'
                : 'border-[#e5e5e5] dark:border-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040]'
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Selection Checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(agent.id);
              }}
              className={`absolute top-3 right-3 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all z-10 ${
                isSelected
                  ? 'border-[#0a0a0a] dark:border-white bg-[#0a0a0a] dark:bg-white'
                  : 'border-[#d4d4d4] dark:border-[#404040] bg-white dark:bg-[#171717] opacity-0 group-hover:opacity-100'
              }`}
            >
              {isSelected && (
                <svg className="w-3.5 h-3.5 text-white dark:text-[#0a0a0a]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </button>

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5f5f5] to-[#e5e5e5] dark:from-[#262626] dark:to-[#171717] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🤖</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#0a0a0a] dark:text-white truncate group-hover:text-[#525252] dark:group-hover:text-[#d4d4d4] transition-colors">
                      {highlightText(agent.name, query)}
                    </h3>
                    <span className="text-[10px] text-[#a3a3a3] font-mono">#{agent.tokenId}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs">{agent.network === 'Base Sepolia' ? '🔷' : agent.network === 'Polygon Amoy' ? '🟣' : '🔵'}</span>
                    <span className="text-xs text-[#737373]">{agent.network}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[#525252] dark:text-[#a3a3a3] line-clamp-2 mb-3 leading-relaxed">
                {highlightText(agent.description, query)}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {agent.skills.slice(0, 2).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#3b82f6]/10 text-[#3b82f6]"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {formatTagName(skill)}
                  </span>
                ))}
                {agent.domains.slice(0, 1).map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#8b5cf6]/10 text-[#8b5cf6]"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {formatTagName(domain)}
                  </span>
                ))}
                {(agent.skills.length + agent.domains.length) > 3 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#f5f5f5] dark:bg-[#262626] text-[#737373]">
                    +{agent.skills.length + agent.domains.length - 3}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#e5e5e5] dark:border-[#262626]">
                {/* Reputation */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-[#fbbf24]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    <span className="text-sm font-semibold text-[#0a0a0a] dark:text-white">{agent.reputationScore}</span>
                  </div>
                  <span className="text-xs text-[#a3a3a3]">({agent.reputationCount})</span>
                </div>

                {/* Status */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                  agent.status === 'active'
                    ? 'bg-[#f0fdf4] text-[#22c55e] dark:bg-[#22c55e]/20'
                    : agent.status === 'validating'
                    ? 'bg-[#fefce8] text-[#eab308] dark:bg-[#eab308]/20'
                    : 'bg-[#f5f5f5] text-[#737373] dark:bg-[#262626]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    agent.status === 'active' ? 'bg-[#22c55e]' :
                    agent.status === 'validating' ? 'bg-[#eab308]' : 'bg-[#737373]'
                  } ${agent.status === 'active' ? 'animate-pulse' : ''}`} />
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
