'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export function Header() {
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);

    // Apply system theme preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Prevent flash of unstyled content
  if (!mounted) {
    return (
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-foreground">
                Agentscan
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="text-foreground/80 hover:text-foreground">
                  Overview
                </Link>
                <Link href="/agents" className="text-foreground/80 hover:text-foreground">
                  Agents
                </Link>
                <Link href="/networks" className="text-foreground/80 hover:text-foreground">
                  Networks
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="text-2xl font-bold text-foreground"
            >
              Agentscan
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-foreground/80 hover:text-foreground"
              >
                Overview
              </Link>
              <Link
                href="/agents"
                className="text-foreground/80 hover:text-foreground"
              >
                Agents
              </Link>
              <Link
                href="/networks"
                className="text-foreground/80 hover:text-foreground"
              >
                Networks
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
