'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { WalletButton } from '@/components/web3/WalletButton';
import { MobileDrawer } from './MobileDrawer';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Global "/" shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchOpen && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/agents', label: 'Agents' },
    { href: '/networks', label: 'Networks' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/insights', label: 'Insights' },
    { href: '/docs', label: 'Docs' },
    { href: '/create', label: 'Create' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/agents?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // SSR placeholder
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#fafafa]/90 dark:bg-[#0a0a0a]/90 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-16">
            <div className="flex items-center space-x-8 lg:space-x-10">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="relative bg-[#0a0a0a] dark:bg-[#fafafa] p-2 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white dark:text-[#0a0a0a]">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-lg lg:text-xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">Agentscan</span>
              </Link>
            </div>
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
            <div className="flex items-center space-x-6 lg:space-x-8">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                <div className="relative bg-[#0a0a0a] dark:bg-[#fafafa] p-2 rounded-lg transform group-hover:scale-105 transition-transform duration-200">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white dark:text-[#0a0a0a]">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-lg lg:text-xl font-bold text-[#0a0a0a] dark:text-[#fafafa] hidden sm:inline">
                  Agentscan
                </span>
              </Link>

              {/* Compact Search - Desktop */}
              <div className="hidden md:block">
                {searchOpen ? (
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                      placeholder="Search agents..."
                      className="w-56 lg:w-64 h-8 pl-8 pr-3 text-[13px] rounded-lg border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717] text-[#0a0a0a] dark:text-[#fafafa] placeholder:text-[#a3a3a3] focus:outline-none focus:border-[#0a0a0a] dark:focus:border-[#fafafa] transition-all"
                    />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a3a3a3]">
                      <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </form>
                ) : (
                  <button
                    onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                    className="flex items-center gap-2 h-8 px-3 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] text-[#a3a3a3] hover:border-[#d4d4d4] dark:hover:border-[#404040] transition-all text-[13px]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="hidden lg:inline">Search</span>
                    <kbd className="hidden lg:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium text-[#a3a3a3] bg-[#f5f5f5] dark:bg-[#262626] rounded border border-[#e5e5e5] dark:border-[#404040]">/</kbd>
                  </button>
                )}
              </div>

              {/* Navigation - Desktop (text only, no icons) */}
              <nav className="hidden md:flex items-center">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`
                        group relative px-3 lg:px-4 py-3 text-[13px] font-medium
                        transition-colors duration-200
                        focus-visible:outline-none
                        ${active
                          ? 'text-[#0a0a0a] dark:text-[#fafafa]'
                          : 'text-[#6e6e73] dark:text-[#86868b] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]'
                        }
                      `}
                    >
                      {link.label}
                      <span
                        className={`
                          absolute bottom-0 left-3 right-3 lg:left-4 lg:right-4 h-[2px] rounded-full
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

            {/* Right side */}
            <div className="flex items-center gap-3">
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
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
