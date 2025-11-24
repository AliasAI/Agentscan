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
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a3a3a3] group-focus-within:text-[#0a0a0a] dark:group-focus-within:text-[#fafafa] transition-colors z-10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-current">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* 动态打字占位符层 */}
        {showTypingPlaceholder && (
          <div
            className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-[#a3a3a3] dark:text-[#525252] pointer-events-none select-none"
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
          className="w-full h-11 px-4 pl-10 pr-10 text-sm rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] text-[#0a0a0a] dark:text-[#fafafa] placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252] focus:outline-none focus:border-[#0a0a0a] dark:focus:border-[#fafafa] focus:ring-2 focus:ring-[#0a0a0a]/10 dark:focus:ring-[#fafafa]/20 transition-all duration-200"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#a3a3a3] hover:text-[#525252] dark:hover:text-[#d4d4d4] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded transition-all duration-200 z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
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
