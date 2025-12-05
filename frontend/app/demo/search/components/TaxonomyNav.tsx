'use client';

import { useState } from 'react';
import type { SkillCategory, DomainCategory } from '../types';

interface TaxonomyNavProps {
  skillCategories: SkillCategory[];
  domainCategories: DomainCategory[];
  selectedSkills: string[];
  selectedDomains: string[];
  onSkillSelect: (skill: string) => void;
  onDomainSelect: (domain: string) => void;
}

export function TaxonomyNav({
  skillCategories,
  domainCategories,
  selectedSkills,
  selectedDomains,
  onSkillSelect,
  onDomainSelect,
}: TaxonomyNavProps) {
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'domains'>('skills');

  return (
    <div className="sticky top-20 space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center rounded-lg bg-[#f5f5f5] dark:bg-[#171717] p-1">
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'skills'
              ? 'bg-white dark:bg-[#262626] text-[#0a0a0a] dark:text-white shadow-sm'
              : 'text-[#737373] hover:text-[#0a0a0a] dark:hover:text-white'
          }`}
        >
          ⚡ Skills
        </button>
        <button
          onClick={() => setActiveTab('domains')}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'domains'
              ? 'bg-white dark:bg-[#262626] text-[#0a0a0a] dark:text-white shadow-sm'
              : 'text-[#737373] hover:text-[#0a0a0a] dark:hover:text-white'
          }`}
        >
          🏢 Domains
        </button>
      </div>

      {/* Skills Nav */}
      {activeTab === 'skills' && (
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
          <div className="p-3 border-b border-[#e5e5e5] dark:border-[#262626]">
            <h3 className="text-xs font-semibold text-[#0a0a0a] dark:text-white uppercase tracking-wide">
              Skills
            </h3>
            <p className="text-[10px] text-[#737373] mt-0.5">Filter by agent capabilities</p>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {skillCategories.map((category) => (
              <div key={category.slug} className="border-b border-[#e5e5e5] dark:border-[#262626] last:border-b-0">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedSkill(expandedSkill === category.slug ? null : category.slug)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#0a0a0a] dark:text-white font-medium">
                      {category.name}
                    </span>
                    {selectedSkills.some(s => s.startsWith(category.slug)) && (
                      <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#737373]">{category.count}</span>
                    <svg
                      className={`w-4 h-4 text-[#737373] transition-transform ${
                        expandedSkill === category.slug ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Subcategories */}
                {expandedSkill === category.slug && (
                  <div className="pb-2 bg-[#fafafa] dark:bg-[#0a0a0a]">
                    {category.subcategories.map((sub) => {
                      const isSelected = selectedSkills.includes(sub.slug);
                      return (
                        <button
                          key={sub.slug}
                          onClick={() => onSkillSelect(sub.slug)}
                          className={`w-full flex items-center justify-between px-3 py-2 pl-6 text-left transition-all ${
                            isSelected
                              ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                              : 'hover:bg-[#f5f5f5] dark:hover:bg-[#171717] text-[#525252] dark:text-[#a3a3a3] hover:text-[#0a0a0a] dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-[#3b82f6] bg-[#3b82f6]'
                                : 'border-[#d4d4d4] dark:border-[#404040]'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm">{sub.name}</span>
                          </div>
                          <span className="text-xs text-[#a3a3a3]">{sub.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domains Nav */}
      {activeTab === 'domains' && (
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
          <div className="p-3 border-b border-[#e5e5e5] dark:border-[#262626]">
            <h3 className="text-xs font-semibold text-[#0a0a0a] dark:text-white uppercase tracking-wide">
              Domains
            </h3>
            <p className="text-[10px] text-[#737373] mt-0.5">Filter by industry or field</p>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {domainCategories.map((category) => (
              <div key={category.slug} className="border-b border-[#e5e5e5] dark:border-[#262626] last:border-b-0">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedDomain(expandedDomain === category.slug ? null : category.slug)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#0a0a0a] dark:text-white font-medium">
                      {category.name}
                    </span>
                    {selectedDomains.some(d => d.startsWith(category.slug)) && (
                      <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#737373]">{category.count}</span>
                    <svg
                      className={`w-4 h-4 text-[#737373] transition-transform ${
                        expandedDomain === category.slug ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Subcategories */}
                {expandedDomain === category.slug && (
                  <div className="pb-2 bg-[#fafafa] dark:bg-[#0a0a0a]">
                    {category.subcategories.map((sub) => {
                      const isSelected = selectedDomains.includes(sub.slug);
                      return (
                        <button
                          key={sub.slug}
                          onClick={() => onDomainSelect(sub.slug)}
                          className={`w-full flex items-center justify-between px-3 py-2 pl-6 text-left transition-all ${
                            isSelected
                              ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]'
                              : 'hover:bg-[#f5f5f5] dark:hover:bg-[#171717] text-[#525252] dark:text-[#a3a3a3] hover:text-[#0a0a0a] dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-[#8b5cf6] bg-[#8b5cf6]'
                                : 'border-[#d4d4d4] dark:border-[#404040]'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm">{sub.name}</span>
                          </div>
                          <span className="text-xs text-[#a3a3a3]">{sub.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-[#f5f5f5] dark:bg-[#171717] rounded-xl p-4 border border-[#e5e5e5] dark:border-[#262626]">
        <h4 className="text-xs font-semibold text-[#0a0a0a] dark:text-white mb-3">Platform Stats</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#737373]">Total Agents</span>
            <span className="font-medium text-[#0a0a0a] dark:text-white">5,234</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#737373]">Active Today</span>
            <span className="font-medium text-[#22c55e]">1,847</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#737373]">New This Week</span>
            <span className="font-medium text-[#3b82f6]">234</span>
          </div>
        </div>
      </div>
    </div>
  );
}
