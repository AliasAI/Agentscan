'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  debounceDelay?: number;
}

export function SearchBar({
  placeholder = 'Search agents by address, name...',
  onSearch,
  debounceDelay = 500,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, debounceDelay);

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearch?.(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Immediate search on submit
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative group">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 pl-12 pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 transition-all shadow-sm hover:shadow-md"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Clear search"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Search hint - appears on focus when empty */}
        {!query && (
          <div className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="hidden group-focus-within:flex items-center gap-2 text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono">⏎</kbd>
              <span>Search</span>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
