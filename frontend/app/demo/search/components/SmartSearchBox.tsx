'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { mockHotSearches, mockSearchHistory, generateSuggestions } from '../data/mockData';
import type { FilterState, SearchSuggestion } from '../types';

interface SmartSearchBoxProps {
  query: string;
  onQueryChange: (query: string) => void;
  onFocusChange: (focused: boolean) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function SmartSearchBox({
  query,
  onQueryChange,
  onFocusChange,
  filters,
  onFiltersChange,
}: SmartSearchBoxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate suggestions on query change
  useEffect(() => {
    if (query.length > 0) {
      const newSuggestions = generateSuggestions(query);
      setSuggestions(newSuggestions);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't blur if clicking inside dropdown
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setTimeout(() => {
      setIsFocused(false);
      onFocusChange(false);
    }, 150);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'agent') {
      onQueryChange(suggestion.label);
    } else if (suggestion.type === 'skill') {
      onFiltersChange({
        ...filters,
        skills: [...filters.skills, suggestion.value],
      });
      onQueryChange('');
    } else if (suggestion.type === 'domain') {
      onFiltersChange({
        ...filters,
        domains: [...filters.domains, suggestion.value],
      });
      onQueryChange('');
    } else if (suggestion.type === 'history') {
      onQueryChange(suggestion.value);
    }
    inputRef.current?.focus();
  };

  // Handle hot search click
  const handleHotSearchClick = (searchQuery: string) => {
    onQueryChange(searchQuery);
    inputRef.current?.focus();
  };

  // Handle history click
  const handleHistoryClick = (historyQuery: string) => {
    onQueryChange(historyQuery);
    inputRef.current?.focus();
  };

  // Clear history item
  const clearHistoryItem = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // In real app, this would update localStorage
    console.log('Clear history item:', item);
  };

  // Highlight matching text
  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={i} className="bg-[#fef08a] text-[#0a0a0a] rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const showDropdown = isFocused && (query.length === 0 || suggestions.length > 0);

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative group">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373] group-focus-within:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search agents, skills, domains..."
          className="w-full h-14 pl-12 pr-12 text-base rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-[#737373] focus:outline-none focus:bg-white/15 focus:border-white/40 focus:ring-4 focus:ring-white/10 transition-all duration-200"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-[#737373] hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-[#171717] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden animate-fade-in-scale z-50"
        >
          {query.length === 0 ? (
            /* Empty state: Hot searches + History */
            <div className="p-4 space-y-4">
              {/* Search History */}
              {mockSearchHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#737373] uppercase tracking-wide">
                      Recent Searches
                    </span>
                    <button className="text-xs text-[#737373] hover:text-white transition-colors">
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mockSearchHistory.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handleHistoryClick(item)}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-[#404040] text-sm text-[#a3a3a3] hover:text-white transition-all"
                      >
                        <svg className="w-3.5 h-3.5 text-[#525252]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {item}
                        <button
                          onClick={(e) => clearHistoryItem(item, e)}
                          className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#525252] transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hot Searches */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-[#fecaca]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 23c6.075 0 11-4.925 11-11 0-4.422-2.617-8.234-6.38-9.969.32 1.584.38 3.228.122 4.86a6.996 6.996 0 01-4.208 5.457 2.75 2.75 0 01-3.924-2.458c0-.26.037-.512.106-.752a6.5 6.5 0 00-5.586 6.434c0 4.125 3.5 7.428 7.87 7.428z" />
                  </svg>
                  <span className="text-xs font-medium text-[#737373] uppercase tracking-wide">
                    Hot Searches
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {mockHotSearches.slice(0, 8).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleHotSearchClick(item.query)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#262626] text-left transition-all group"
                    >
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                        i < 3 ? 'bg-[#fef08a] text-[#0a0a0a]' : 'bg-[#262626] text-[#737373]'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-[#a3a3a3] group-hover:text-white truncate transition-colors">
                        {item.query}
                      </span>
                      {item.isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#fecaca] text-[#0a0a0a]">
                          NEW
                        </span>
                      )}
                      {item.trend === 'up' && (
                        <svg className="w-3.5 h-3.5 text-[#22c55e]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4l-8 8h5v8h6v-8h5l-8-8z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Suggestions */
            <div className="py-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={`${suggestion.type}-${suggestion.value}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    i === selectedIndex ? 'bg-[#262626]' : 'hover:bg-[#1a1a1a]'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    suggestion.type === 'agent' ? 'bg-[#0a0a0a] border border-[#262626]' :
                    suggestion.type === 'skill' ? 'bg-[#3b82f6]/20' :
                    suggestion.type === 'domain' ? 'bg-[#8b5cf6]/20' :
                    'bg-[#262626]'
                  }`}>
                    {suggestion.type === 'agent' && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {suggestion.type === 'skill' && (
                      <svg className="w-4 h-4 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {suggestion.type === 'domain' && (
                      <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                    {suggestion.type === 'history' && (
                      <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {suggestion.highlight ? highlightText(suggestion.label, suggestion.highlight) : suggestion.label}
                    </div>
                    {suggestion.sublabel && (
                      <div className="text-xs text-[#737373]">{suggestion.sublabel}</div>
                    )}
                  </div>

                  {/* Type Badge */}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                    suggestion.type === 'agent' ? 'bg-[#262626] text-[#a3a3a3]' :
                    suggestion.type === 'skill' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' :
                    suggestion.type === 'domain' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' :
                    'bg-[#262626] text-[#737373]'
                  }`}>
                    {suggestion.type}
                  </span>
                </button>
              ))}

              {suggestions.length === 0 && query.length > 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-[#737373]">No results found for "{query}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
