'use client';

import type { DemoAgent } from '../types';

interface ComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgentIds: string[];
  agents: DemoAgent[];
  onRemoveAgent: (id: string) => void;
}

export function ComparisonDrawer({
  isOpen,
  onClose,
  selectedAgentIds,
  agents,
  onRemoveAgent,
}: ComparisonDrawerProps) {
  if (!isOpen) return null;

  const selectedAgents = agents.filter(a => selectedAgentIds.includes(a.id));

  // Format tag name
  const formatTagName = (slug: string): string => {
    const name = slug.includes('/') ? slug.split('/').pop()! : slug;
    return name.replace(/_/g, ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Comparison attributes
  const comparisonRows = [
    {
      label: 'Network',
      key: 'network',
      render: (agent: DemoAgent) => (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#f5f5f5] dark:bg-[#262626] text-xs">
          <span>{agent.network === 'Base Sepolia' ? '🔷' : agent.network === 'Polygon Amoy' ? '🟣' : '🔵'}</span>
          {agent.network}
        </span>
      ),
    },
    {
      label: 'Reputation',
      key: 'reputation',
      render: (agent: DemoAgent) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-[#fbbf24]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <span className="text-lg font-bold text-[#0a0a0a] dark:text-white">{agent.reputationScore}</span>
          </div>
          <span className="text-xs text-[#a3a3a3]">({agent.reputationCount} reviews)</span>
        </div>
      ),
    },
    {
      label: 'Status',
      key: 'status',
      render: (agent: DemoAgent) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
          agent.status === 'active'
            ? 'bg-[#f0fdf4] text-[#22c55e] dark:bg-[#22c55e]/20'
            : agent.status === 'validating'
            ? 'bg-[#fefce8] text-[#eab308] dark:bg-[#eab308]/20'
            : 'bg-[#f5f5f5] text-[#737373] dark:bg-[#262626]'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            agent.status === 'active' ? 'bg-[#22c55e]' :
            agent.status === 'validating' ? 'bg-[#eab308]' : 'bg-[#737373]'
          }`} />
          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
        </span>
      ),
    },
    {
      label: 'Created',
      key: 'createdAt',
      render: (agent: DemoAgent) => (
        <span className="text-sm text-[#525252] dark:text-[#a3a3a3]">
          {new Date(agent.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      label: 'Skills',
      key: 'skills',
      render: (agent: DemoAgent) => (
        <div className="flex flex-wrap gap-1">
          {agent.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#3b82f6]/10 text-[#3b82f6]"
            >
              {formatTagName(skill)}
            </span>
          ))}
          {agent.skills.length > 3 && (
            <span className="text-xs text-[#a3a3a3]">+{agent.skills.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      label: 'Domains',
      key: 'domains',
      render: (agent: DemoAgent) => (
        <div className="flex flex-wrap gap-1">
          {agent.domains.slice(0, 3).map((domain) => (
            <span
              key={domain}
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#8b5cf6]/10 text-[#8b5cf6]"
            >
              {formatTagName(domain)}
            </span>
          ))}
          {agent.domains.length > 3 && (
            <span className="text-xs text-[#a3a3a3]">+{agent.domains.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      label: 'MCP Tools',
      key: 'mcpTools',
      render: (agent: DemoAgent) => (
        <div className="flex flex-wrap gap-1">
          {agent.mcpTools.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#f5f5f5] dark:bg-[#262626] text-[#525252] dark:text-[#a3a3a3]"
            >
              {tool}
            </span>
          ))}
        </div>
      ),
    },
    {
      label: 'A2A Skills',
      key: 'a2aSkills',
      render: (agent: DemoAgent) => (
        <div className="flex flex-wrap gap-1">
          {agent.a2aSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#f5f5f5] dark:bg-[#262626] text-[#525252] dark:text-[#a3a3a3]"
            >
              {skill}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#0a0a0a] rounded-t-2xl shadow-2xl animate-slide-up max-h-[85vh] overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-[#d4d4d4] dark:bg-[#404040]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] dark:border-[#262626]">
          <div>
            <h2 className="text-lg font-semibold text-[#0a0a0a] dark:text-white">
              Compare Agents
            </h2>
            <p className="text-sm text-[#737373]">
              {selectedAgents.length} of 4 agents selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#737373] hover:text-[#0a0a0a] dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full min-w-[800px]">
            {/* Agent Headers */}
            <thead>
              <tr className="border-b border-[#e5e5e5] dark:border-[#262626]">
                <th className="w-32 px-6 py-4 text-left bg-[#f5f5f5] dark:bg-[#171717] sticky left-0 z-10"></th>
                {selectedAgents.map((agent) => (
                  <th key={agent.id} className="px-4 py-4 text-left min-w-[200px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5f5f5] to-[#e5e5e5] dark:from-[#262626] dark:to-[#171717] flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">🤖</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#0a0a0a] dark:text-white text-sm">
                            {agent.name}
                          </h3>
                          <span className="text-[10px] text-[#a3a3a3] font-mono">#{agent.tokenId}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveAgent(agent.id)}
                        className="p-1 text-[#a3a3a3] hover:text-[#ef4444] hover:bg-[#fef2f2] dark:hover:bg-[#ef4444]/10 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
                {/* Empty columns for remaining slots */}
                {Array.from({ length: 4 - selectedAgents.length }).map((_, i) => (
                  <th key={`empty-${i}`} className="px-4 py-4 min-w-[200px]">
                    <div className="w-full h-16 rounded-xl border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] flex items-center justify-center">
                      <span className="text-xs text-[#a3a3a3]">Add agent</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Comparison Rows */}
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.key} className="border-b border-[#e5e5e5] dark:border-[#262626] last:border-b-0">
                  <td className="px-6 py-3 bg-[#f5f5f5] dark:bg-[#171717] sticky left-0 z-10">
                    <span className="text-xs font-medium text-[#737373] uppercase tracking-wide">
                      {row.label}
                    </span>
                  </td>
                  {selectedAgents.map((agent) => (
                    <td key={agent.id} className="px-4 py-3">
                      {row.render(agent)}
                    </td>
                  ))}
                  {/* Empty cells for remaining slots */}
                  {Array.from({ length: 4 - selectedAgents.length }).map((_, i) => (
                    <td key={`empty-${row.key}-${i}`} className="px-4 py-3">
                      <span className="text-[#d4d4d4] dark:text-[#404040]">—</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#f5f5f5] dark:bg-[#171717]">
          <button
            onClick={() => selectedAgentIds.forEach(id => onRemoveAgent(id))}
            className="px-4 py-2 text-sm text-[#ef4444] hover:bg-[#fef2f2] dark:hover:bg-[#ef4444]/10 rounded-lg transition-colors"
          >
            Clear All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#525252] dark:text-[#a3a3a3] hover:bg-[#e5e5e5] dark:hover:bg-[#262626] rounded-lg transition-colors"
            >
              Close
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-lg hover:opacity-90 transition-opacity">
              Export Comparison
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
