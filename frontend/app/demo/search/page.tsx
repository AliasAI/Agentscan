'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SearchDemoHeader } from './components/SearchDemoHeader';
import { SmartSearchBox } from './components/SmartSearchBox';
import { TaxonomyNav } from './components/TaxonomyNav';
import { FilterPanel } from './components/FilterPanel';
import { ActiveFilters } from './components/ActiveFilters';
import { ResultsGrid } from './components/ResultsGrid';
import { ComparisonDrawer } from './components/ComparisonDrawer';
import { mockAgents, mockSkillCategories, mockDomainCategories } from './data/mockData';
import type { DemoAgent, FilterState, SortOption } from './types';

export default function SearchDemoPage() {
  // Search state
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    networks: [],
    skills: [],
    domains: [],
    reputationRange: [0, 100],
    status: [],
    createdTime: null,
  });

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('comprehensive');

  // View state
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Comparison state
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showComparisonDrawer, setShowComparisonDrawer] = useState(false);

  // Filter panel state (mobile)
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter agents based on current state
  const filteredAgents = useCallback(() => {
    let result = [...mockAgents];

    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(agent =>
        agent.name.toLowerCase().includes(lowerQuery) ||
        agent.description.toLowerCase().includes(lowerQuery) ||
        agent.skills.some(s => s.toLowerCase().includes(lowerQuery)) ||
        agent.domains.some(d => d.toLowerCase().includes(lowerQuery))
      );
    }

    // Network filter
    if (filters.networks.length > 0) {
      result = result.filter(agent => filters.networks.includes(agent.network));
    }

    // Skills filter
    if (filters.skills.length > 0) {
      result = result.filter(agent =>
        agent.skills.some(s => filters.skills.includes(s))
      );
    }

    // Domains filter
    if (filters.domains.length > 0) {
      result = result.filter(agent =>
        agent.domains.some(d => filters.domains.includes(d))
      );
    }

    // Reputation filter
    result = result.filter(agent =>
      agent.reputationScore >= filters.reputationRange[0] &&
      agent.reputationScore <= filters.reputationRange[1]
    );

    // Status filter
    if (filters.status.length > 0) {
      result = result.filter(agent => filters.status.includes(agent.status));
    }

    // Sort
    switch (sortBy) {
      case 'comprehensive':
        // Weighted score: reputation + activity + relevance
        result.sort((a, b) => {
          const scoreA = a.reputationScore * 0.35 + a.activityScore * 0.25 + a.relevanceScore * 0.25 + a.taxonomyCoverage * 0.15;
          const scoreB = b.reputationScore * 0.35 + b.activityScore * 0.25 + b.relevanceScore * 0.25 + b.taxonomyCoverage * 0.15;
          return scoreB - scoreA;
        });
        break;
      case 'hot':
        result.sort((a, b) => b.activityScore - a.activityScore);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'reputation':
        result.sort((a, b) => b.reputationScore - a.reputationScore);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [query, filters, sortBy]);

  const agents = filteredAgents();

  // Handle comparison toggle
  const toggleCompare = (agentId: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      }
      if (prev.length >= 4) {
        return prev; // Max 4 agents
      }
      return [...prev, agentId];
    });
  };

  // Clear single filter
  const clearFilter = (type: keyof FilterState, value?: string) => {
    setFilters(prev => {
      if (type === 'reputationRange') {
        return { ...prev, reputationRange: [0, 100] };
      }
      if (type === 'createdTime') {
        return { ...prev, createdTime: null };
      }
      if (value && Array.isArray(prev[type])) {
        return { ...prev, [type]: (prev[type] as string[]).filter(v => v !== value) };
      }
      return { ...prev, [type]: [] };
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      networks: [],
      skills: [],
      domains: [],
      reputationRange: [0, 100],
      status: [],
      createdTime: null,
    });
    setQuery('');
  };

  // Count active filters
  const activeFilterCount =
    filters.networks.length +
    filters.skills.length +
    filters.domains.length +
    filters.status.length +
    (filters.reputationRange[0] > 0 || filters.reputationRange[1] < 100 ? 1 : 0) +
    (filters.createdTime ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Header with branding */}
      <SearchDemoHeader />

      {/* Hero Search Section */}
      <section className="relative bg-gradient-to-b from-[#0a0a0a] to-[#171717] dark:from-[#0a0a0a] dark:to-[#0a0a0a] py-12 md:py-20">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative max-w-5xl mx-auto px-4">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Discover AI Agents
            </h1>
            <p className="text-[#a3a3a3] text-sm md:text-base">
              Explore 5,000+ ERC-8004 agents across multiple chains
            </p>
          </div>

          {/* Smart Search Box */}
          <SmartSearchBox
            query={query}
            onQueryChange={setQuery}
            onFocusChange={setIsSearchFocused}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Quick Category Tiles */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 md:gap-3">
            {['DeFi', 'NLP', 'Trading', 'Gaming', 'Code', 'Vision', 'RAG', 'NFT'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilters(prev => ({ ...prev, domains: [cat.toLowerCase()] }))}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-white/20"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Taxonomy Nav (Desktop) */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <TaxonomyNav
              skillCategories={mockSkillCategories}
              domainCategories={mockDomainCategories}
              selectedSkills={filters.skills}
              selectedDomains={filters.domains}
              onSkillSelect={(skill) => {
                setFilters(prev => ({
                  ...prev,
                  skills: prev.skills.includes(skill)
                    ? prev.skills.filter(s => s !== skill)
                    : [...prev.skills, skill]
                }));
              }}
              onDomainSelect={(domain) => {
                setFilters(prev => ({
                  ...prev,
                  domains: prev.domains.includes(domain)
                    ? prev.domains.filter(d => d !== domain)
                    : [...prev.domains, domain]
                }));
              }}
            />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              {/* Left: Result count + Active Filters */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#525252] dark:text-[#a3a3a3]">
                  <span className="font-semibold text-[#0a0a0a] dark:text-[#fafafa]">{agents.length}</span> agents found
                </span>

                {/* Mobile filter button */}
                <button
                  onClick={() => setShowFilterPanel(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#262626] text-sm text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] text-xs flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Right: Sort + View Toggle + Compare */}
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-9 px-3 pr-8 text-sm rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] text-[#0a0a0a] dark:text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 dark:focus:ring-[#fafafa]/20 appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23737373'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                >
                  <option value="comprehensive">Comprehensive</option>
                  <option value="hot">Hot</option>
                  <option value="newest">Newest</option>
                  <option value="reputation">Highest Reputation</option>
                  <option value="name">Name A–Z</option>
                </select>

                {/* View Toggle */}
                <div className="flex items-center rounded-lg border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`p-2 ${viewMode === 'card' ? 'bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a]' : 'bg-white dark:bg-[#171717] text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]'} transition-colors`}
                    title="Card View"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a]' : 'bg-white dark:bg-[#171717] text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]'} transition-colors`}
                    title="List View"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none" />
                    </svg>
                  </button>
                </div>

                {/* Compare Button */}
                {selectedForCompare.length > 0 && (
                  <button
                    onClick={() => setShowComparisonDrawer(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Compare ({selectedForCompare.length})
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters */}
            <ActiveFilters
              filters={filters}
              query={query}
              onClearFilter={clearFilter}
              onClearQuery={() => setQuery('')}
              onClearAll={clearAllFilters}
            />

            {/* Results */}
            <ResultsGrid
              agents={agents}
              viewMode={viewMode}
              query={query}
              selectedForCompare={selectedForCompare}
              onToggleCompare={toggleCompare}
            />
          </div>
        </div>
      </main>

      {/* Filter Panel (Mobile Drawer) */}
      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        filters={filters}
        onFiltersChange={setFilters}
        skillCategories={mockSkillCategories}
        domainCategories={mockDomainCategories}
      />

      {/* Comparison Drawer */}
      <ComparisonDrawer
        isOpen={showComparisonDrawer}
        onClose={() => setShowComparisonDrawer(false)}
        selectedAgentIds={selectedForCompare}
        agents={mockAgents}
        onRemoveAgent={(id) => setSelectedForCompare(prev => prev.filter(a => a !== id))}
      />
    </div>
  );
}
