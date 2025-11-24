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

  const navLinks = [
    { href: '/', label: 'Overview', icon: '📊' },
    { href: '/agents', label: 'Agents', icon: '🤖' },
    { href: '/networks', label: 'Networks', icon: '🌐' },
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
              <nav className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-all text-[#737373] dark:text-[#737373]"
                  >
                    <span className="mr-1.5">{link.icon}</span>
                    {link.label}
                  </Link>
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

            {/* Navigation - 黑白配色 */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 relative
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]
                      ${active
                        ? 'text-[#0a0a0a] dark:text-[#fafafa] bg-[#f5f5f5] dark:bg-[#262626]'
                        : 'text-[#737373] dark:text-[#737373] hover:text-[#525252] dark:hover:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]'
                      }
                    `}
                  >
                    <span className="mr-1.5">{link.icon}</span>
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#0a0a0a] dark:bg-[#fafafa] rounded-full"></span>
                    )}
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
