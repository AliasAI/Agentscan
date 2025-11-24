'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

// 动态占位符提示语列表
const PLACEHOLDER_SUGGESTIONS = [
  'Search agents by name...',
  'Search by wallet address...',
  'Find AI assistants...',
  'Explore DeFi agents...',
  'Discover trading bots...',
];

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  debounceDelay?: number;
}

// 动态打字占位符 Hook - 使用 requestAnimationFrame 实现更流畅的动画
function useTypingPlaceholder(suggestions: string[], typingSpeed = 30, pauseDuration = 1500) {
  const [displayText, setDisplayText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // 使用 ref 存储所有状态，避免闭包问题
  const stateRef = useRef({
    suggestionIndex: 0,
    charIndex: 0,
    isTyping: true,
    lastTime: 0,
    isPaused: false,
    pauseStartTime: 0,
  });
  const rafRef = useRef<number | null>(null);
  const isFocusedRef = useRef(false);

  // 同步 isFocused 到 ref
  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(() => {
    const state = stateRef.current;

    const animate = (timestamp: number) => {
      if (isFocusedRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentSuggestion = suggestions[state.suggestionIndex];

      // 处理暂停状态
      if (state.isPaused) {
        if (timestamp - state.pauseStartTime >= pauseDuration) {
          state.isPaused = false;
          state.isTyping = false; // 开始删除
        }
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // 控制打字/删除速度
      const delay = state.isTyping ? typingSpeed : typingSpeed * 0.6;
      if (timestamp - state.lastTime < delay) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      state.lastTime = timestamp;

      if (state.isTyping) {
        // 正在打字
        if (state.charIndex < currentSuggestion.length) {
          state.charIndex++;
          setDisplayText(currentSuggestion.slice(0, state.charIndex));
        } else {
          // 打字完成，进入暂停
          state.isPaused = true;
          state.pauseStartTime = timestamp;
        }
      } else {
        // 正在删除
        if (state.charIndex > 0) {
          state.charIndex--;
          setDisplayText(currentSuggestion.slice(0, state.charIndex));
        } else {
          // 删除完成，切换到下一条
          state.isTyping = true;
          state.suggestionIndex = (state.suggestionIndex + 1) % suggestions.length;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [suggestions, typingSpeed, pauseDuration]);

  return { displayText, isFocused, setIsFocused };
}

export function SearchBar({
  onSearch,
  debounceDelay = 500,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, debounceDelay);
  const { displayText, isFocused, setIsFocused } = useTypingPlaceholder(PLACEHOLDER_SUGGESTIONS);
  const inputRef = useRef<HTMLInputElement>(null);

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearch?.(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  // 决定显示什么占位符
  const showTypingPlaceholder = !query && !isFocused;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors z-10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-current">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* 动态打字占位符层 */}
        {showTypingPlaceholder && (
          <div
            className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none select-none"
            onClick={() => inputRef.current?.focus()}
          >
            {displayText}
            <span className="animate-pulse">|</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? 'Type to search...' : ''}
          className="w-full px-3 py-2 pl-9 pr-9 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 transition-all"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors z-10"
            title="Clear search"
            aria-label="Clear search"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
