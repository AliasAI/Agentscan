'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);

    // Apply system theme preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // SVG 图标组件
  const NavIcon = ({ type }: { type: 'overview' | 'agents' | 'networks' }) => {
    const icons = {
      overview: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
      agents: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* 机器人头部 */}
          <rect x="4" y="6" width="16" height="12" rx="2" />
          {/* 天线 */}
          <path d="M12 6V3" />
          <circle cx="12" cy="2" r="1" />
          {/* 眼睛 */}
          <circle cx="9" cy="11" r="1.5" />
          <circle cx="15" cy="11" r="1.5" />
          {/* 嘴巴 */}
          <path d="M9 15h6" />
        </svg>
      ),
      networks: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <circle cx="4" cy="6" r="2" />
          <circle cx="20" cy="6" r="2" />
          <circle cx="4" cy="18" r="2" />
          <circle cx="20" cy="18" r="2" />
          <path d="M9.5 10.5L5.5 7.5M14.5 10.5L18.5 7.5M9.5 13.5L5.5 16.5M14.5 13.5L18.5 16.5" />
        </svg>
      ),
    };
    return icons[type];
  };

  const navLinks = [
    { href: '/', label: 'Overview', iconType: 'overview' as const },
    { href: '/agents', label: 'Agents', iconType: 'agents' as const },
    { href: '/networks', label: 'Networks', iconType: 'networks' as const },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#fafafa]/90 dark:bg-[#0a0a0a]/90 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-16">
            <div className="flex items-center space-x-8 lg:space-x-12">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="relative bg-[#0a0a0a] dark:bg-[#fafafa] p-2 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white dark:text-[#0a0a0a]">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg lg:text-xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
                    Agentscan
                  </span>
                  <span className="text-xs font-medium text-[#a3a3a3] dark:text-[#525252] hidden sm:inline">
                    by alias
                  </span>
                </div>
              </Link>
              <nav className="hidden md:flex items-center">
                {navLinks.map((link) => (
                  <span
                    key={link.href}
                    className="px-4 py-1 text-[13px] font-normal text-[#6e6e73] dark:text-[#86868b] flex items-center gap-1.5"
                  >
                    <NavIcon type={link.iconType} />
                    {link.label}
                  </span>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#fafafa]/90 dark:bg-[#0a0a0a]/90 border-b border-[#e5e5e5] dark:border-[#262626] transition-all">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          <div className="flex items-center space-x-8 lg:space-x-12">
            {/* Logo - 黑白风格 */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative bg-[#0a0a0a] dark:bg-[#fafafa] p-2 rounded-lg transform group-hover:scale-105 transition-transform duration-200">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white dark:text-[#0a0a0a]">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg lg:text-xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
                  Agentscan
                </span>
                <span className="text-xs font-medium text-[#a3a3a3] dark:text-[#525252] hidden sm:inline">
                  by alias
                </span>
              </div>
            </Link>

            {/* Navigation - Apple 风格 + 底部线条指示器 */}
            <nav className="hidden md:flex items-center">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      group relative px-4 py-3 text-[13px] font-normal
                      transition-colors duration-200 flex items-center gap-1.5
                      focus-visible:outline-none
                      ${active
                        ? 'text-[#0a0a0a] dark:text-[#fafafa]'
                        : 'text-[#6e6e73] dark:text-[#86868b] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]'
                      }
                    `}
                  >
                    <NavIcon type={link.iconType} />
                    <span>{link.label}</span>

                    {/* 底部线条指示器 */}
                    <span
                      className={`
                        absolute bottom-0 left-4 right-4 h-[2px] rounded-full
                        transition-opacity duration-200
                        ${active
                          ? 'bg-[#0a0a0a] dark:bg-[#fafafa] opacity-100'
                          : 'bg-[#0a0a0a] dark:bg-[#fafafa] opacity-0 group-hover:opacity-30'
                        }
                      `}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
