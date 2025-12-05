'use client';

import Link from 'next/link';

export function SearchDemoHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fafafa] to-[#d4d4d4] flex items-center justify-center">
            <span className="text-[#0a0a0a] font-bold text-sm">8K</span>
          </div>
          <span className="text-white font-semibold text-lg">
            agentscan
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#fef08a] text-[#0a0a0a]">
            DEMO
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/agents" className="text-sm text-[#a3a3a3] hover:text-white transition-colors">
            Agents
          </Link>
          <Link href="/networks" className="text-sm text-[#a3a3a3] hover:text-white transition-colors">
            Networks
          </Link>
          <Link href="#" className="text-sm text-white font-medium">
            Search
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Network Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#171717] border border-[#262626]">
            <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-xs text-[#a3a3a3]">Multi-chain</span>
          </div>

          {/* Connect Button */}
          <button className="px-4 py-2 rounded-lg bg-white text-[#0a0a0a] text-sm font-medium hover:bg-[#e5e5e5] transition-colors">
            Connect
          </button>
        </div>
      </div>
    </header>
  );
}
