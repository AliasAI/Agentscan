'use client';

import { useState } from 'react';
import type { FilterState, SkillCategory, DomainCategory, AgentStatus, CreatedTimePreset } from '../types';
import { networkOptions } from '../data/mockData';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  skillCategories: SkillCategory[];
  domainCategories: DomainCategory[];
}

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  skillCategories,
  domainCategories,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [activeSection, setActiveSection] = useState<string | null>('network');

  // Apply filters and close
  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  // Reset filters
  const handleReset = () => {
    const resetFilters: FilterState = {
      networks: [],
      skills: [],
      domains: [],
      reputationRange: [0, 100],
      status: [],
      createdTime: null,
    };
    setLocalFilters(resetFilters);
  };

  // Toggle network
  const toggleNetwork = (network: string) => {
    setLocalFilters(prev => ({
      ...prev,
      networks: prev.networks.includes(network)
        ? prev.networks.filter(n => n !== network)
        : [...prev.networks, network],
    }));
  };

  // Toggle status
  const toggleStatus = (status: AgentStatus) => {
    setLocalFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  };

  // Set created time
  const setCreatedTime = (time: CreatedTimePreset | null) => {
    setLocalFilters(prev => ({ ...prev, createdTime: time }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-[#0a0a0a] z-50 lg:hidden shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-lg font-semibold text-[#0a0a0a] dark:text-white">Filters</h2>
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
        <div className="overflow-y-auto h-[calc(100vh-14rem)]">
          {/* Network */}
          <FilterSection
            title="Network"
            isOpen={activeSection === 'network'}
            onToggle={() => setActiveSection(activeSection === 'network' ? null : 'network')}
            count={localFilters.networks.length}
          >
            <div className="grid grid-cols-2 gap-2">
              {networkOptions.map((network) => {
                const isSelected = localFilters.networks.includes(network.value);
                return (
                  <button
                    key={network.value}
                    onClick={() => toggleNetwork(network.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[#0a0a0a] dark:border-white bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a]'
                        : 'border-[#e5e5e5] dark:border-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040]'
                    }`}
                  >
                    <span className="text-lg">{network.icon}</span>
                    <span className="text-sm font-medium">{network.label}</span>
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Status */}
          <FilterSection
            title="Status"
            isOpen={activeSection === 'status'}
            onToggle={() => setActiveSection(activeSection === 'status' ? null : 'status')}
            count={localFilters.status.length}
          >
            <div className="flex flex-wrap gap-2">
              {(['active', 'inactive', 'validating'] as AgentStatus[]).map((status) => {
                const isSelected = localFilters.status.includes(status);
                const statusConfig = {
                  active: { label: 'Active', color: 'bg-[#22c55e]' },
                  inactive: { label: 'Inactive', color: 'bg-[#737373]' },
                  validating: { label: 'Validating', color: 'bg-[#eab308]' },
                };
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[#0a0a0a] dark:border-white bg-[#f5f5f5] dark:bg-[#171717]'
                        : 'border-[#e5e5e5] dark:border-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusConfig[status].color}`} />
                    <span className="text-sm">{statusConfig[status].label}</span>
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Reputation */}
          <FilterSection
            title="Reputation Score"
            isOpen={activeSection === 'reputation'}
            onToggle={() => setActiveSection(activeSection === 'reputation' ? null : 'reputation')}
            count={localFilters.reputationRange[0] > 0 || localFilters.reputationRange[1] < 100 ? 1 : 0}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-[#737373] mb-1 block">Min</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={localFilters.reputationRange[0]}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      reputationRange: [parseInt(e.target.value) || 0, prev.reputationRange[1]],
                    }))}
                    className="w-full h-10 px-3 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] text-[#0a0a0a] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 dark:focus:ring-white/10"
                  />
                </div>
                <span className="text-[#737373] mt-5">—</span>
                <div className="flex-1">
                  <label className="text-xs text-[#737373] mb-1 block">Max</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={localFilters.reputationRange[1]}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      reputationRange: [prev.reputationRange[0], parseInt(e.target.value) || 100],
                    }))}
                    className="w-full h-10 px-3 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] text-[#0a0a0a] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 dark:focus:ring-white/10"
                  />
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All', range: [0, 100] as [number, number] },
                  { label: '80+', range: [80, 100] as [number, number] },
                  { label: '60+', range: [60, 100] as [number, number] },
                  { label: '40+', range: [40, 100] as [number, number] },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setLocalFilters(prev => ({ ...prev, reputationRange: preset.range }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      localFilters.reputationRange[0] === preset.range[0] && localFilters.reputationRange[1] === preset.range[1]
                        ? 'bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a]'
                        : 'bg-[#f5f5f5] dark:bg-[#171717] text-[#525252] dark:text-[#a3a3a3] hover:bg-[#e5e5e5] dark:hover:bg-[#262626]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* Created Time */}
          <FilterSection
            title="Created Time"
            isOpen={activeSection === 'createdTime'}
            onToggle={() => setActiveSection(activeSection === 'createdTime' ? null : 'createdTime')}
            count={localFilters.createdTime ? 1 : 0}
          >
            <div className="flex flex-wrap gap-2">
              {[
                { value: null, label: 'All Time' },
                { value: '24h' as CreatedTimePreset, label: 'Last 24 hours' },
                { value: '7d' as CreatedTimePreset, label: 'Last 7 days' },
                { value: '30d' as CreatedTimePreset, label: 'Last 30 days' },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => setCreatedTime(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    localFilters.createdTime === option.value
                      ? 'bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a]'
                      : 'bg-[#f5f5f5] dark:bg-[#171717] text-[#525252] dark:text-[#a3a3a3] hover:bg-[#e5e5e5] dark:hover:bg-[#262626]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Skills */}
          <FilterSection
            title="Skills"
            isOpen={activeSection === 'skills'}
            onToggle={() => setActiveSection(activeSection === 'skills' ? null : 'skills')}
            count={localFilters.skills.length}
          >
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {skillCategories.flatMap(cat => cat.subcategories).slice(0, 15).map((skill) => {
                const isSelected = localFilters.skills.includes(skill.slug);
                return (
                  <button
                    key={skill.slug}
                    onClick={() => setLocalFilters(prev => ({
                      ...prev,
                      skills: isSelected
                        ? prev.skills.filter(s => s !== skill.slug)
                        : [...prev.skills, skill.slug],
                    }))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                        : 'hover:bg-[#f5f5f5] dark:hover:bg-[#171717] text-[#525252] dark:text-[#a3a3a3]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#3b82f6] bg-[#3b82f6]' : 'border-[#d4d4d4] dark:border-[#404040]'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm">{skill.name}</span>
                    </div>
                    <span className="text-xs text-[#a3a3a3]">{skill.count}</span>
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Domains */}
          <FilterSection
            title="Domains"
            isOpen={activeSection === 'domains'}
            onToggle={() => setActiveSection(activeSection === 'domains' ? null : 'domains')}
            count={localFilters.domains.length}
          >
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {domainCategories.flatMap(cat => cat.subcategories).slice(0, 15).map((domain) => {
                const isSelected = localFilters.domains.includes(domain.slug);
                return (
                  <button
                    key={domain.slug}
                    onClick={() => setLocalFilters(prev => ({
                      ...prev,
                      domains: isSelected
                        ? prev.domains.filter(d => d !== domain.slug)
                        : [...prev.domains, domain.slug],
                    }))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]'
                        : 'hover:bg-[#f5f5f5] dark:hover:bg-[#171717] text-[#525252] dark:text-[#a3a3a3]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#8b5cf6] bg-[#8b5cf6]' : 'border-[#d4d4d4] dark:border-[#404040]'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm">{domain.name}</span>
                    </div>
                    <span className="text-xs text-[#a3a3a3]">{domain.count}</span>
                  </button>
                );
              })}
            </div>
          </FilterSection>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#0a0a0a] border-t border-[#e5e5e5] dark:border-[#262626]">
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 h-12 rounded-xl border border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] font-medium hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex-1 h-12 rounded-xl bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] font-medium hover:opacity-90 transition-opacity"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Filter Section Component
function FilterSection({
  title,
  isOpen,
  onToggle,
  count,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#e5e5e5] dark:border-[#262626]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#0a0a0a] dark:text-white">{title}</span>
          {count > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] text-xs flex items-center justify-center font-medium">
              {count}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-[#737373] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
