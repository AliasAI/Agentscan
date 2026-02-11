'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { WalletButton } from '@/components/web3/WalletButton';
import { MobileDrawer } from './MobileDrawer';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);

    // Apply system theme preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // SVG 图标组件 - 统一使用简洁线条风格
  const NavIcon = ({ type }: { type: 'overview' | 'agents' | 'networks' | 'leaderboard' | 'insights' | 'create' }) => {
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
          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" />
          <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" />
        </svg>
      ),
      networks: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12H22" />
          <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" />
        </svg>
      ),
      leaderboard: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5C3.83696 9 3.20107 8.73661 2.73223 8.26777C2.26339 7.79893 2 7.16304 2 6.5C2 5.83696 2.26339 5.20107 2.73223 4.73223C3.20107 4.26339 3.83696 4 4.5 4H6" />
          <path d="M18 9H19.5C20.163 9 20.7989 8.73661 21.2678 8.26777C21.7366 7.79893 22 7.16304 22 6.5C22 5.83696 21.7366 5.20107 21.2678 4.73223C20.7989 4.26339 20.163 4 19.5 4H18" />
          <path d="M4 22H20" />
          <path d="M10 14.66V17C10 17.55 9.55 18 9 18H8C7.45 18 7 18.45 7 19V22" />
          <path d="M14 14.66V17C14 17.55 14.45 18 15 18H16C16.55 18 17 18.45 17 19V22" />
          <path d="M18 2H6V9C6 12.314 8.686 15 12 15C15.314 15 18 12.314 18 9V2Z" />
        </svg>
      ),
      insights: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20V10M18 20V4M6 20V16" />
        </svg>
      ),
      create: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8V16" />
          <path d="M8 12H16" />
        </svg>
      ),
    };
    return icons[type];
  };

  const navLinks = [
    { href: '/', label: 'Overview', iconType: 'overview' as const },
    { href: '/agents', label: 'Agents', iconType: 'agents' as const },
    { href: '/networks', label: 'Networks', iconType: 'networks' as const },
    { href: '/leaderboard', label: 'Leaderboard', iconType: 'leaderboard' as const },
    { href: '/insights', label: 'Insights', iconType: 'insights' as const },
    { href: '/create', label: 'Create', iconType: 'create' as const },
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
            {/* Hamburger placeholder for SSR */}
            <div className="md:hidden w-9 h-9" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#fafafa]/90 dark:bg-[#0a0a0a]/90 border-b border-[#e5e5e5] dark:border-[#262626] transition-all">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-16">
            <div className="flex items-center space-x-8 lg:space-x-12">
              {/* Logo */}
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

              {/* Navigation - Desktop */}
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

            {/* Wallet Button - Desktop */}
            <div className="hidden md:flex items-center">
              <WalletButton />
            </div>

            {/* Hamburger - Mobile */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg text-[#525252] dark:text-[#a3a3a3] hover:bg-[#e5e5e5]/50 dark:hover:bg-[#262626]/50 transition-colors"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 7H20" />
                <path d="M4 12H20" />
                <path d="M4 17H20" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer - outside header to avoid stacking context issues */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
