'use client';

import { useState } from 'react';
import { DocsSidebar } from '@/components/docs/DocsSidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="max-w-[1400px] mx-auto flex min-h-[calc(100vh-64px)]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 right-6 z-50 md:hidden w-12 h-12 rounded-full bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] shadow-lg flex items-center justify-center"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-72 bg-white dark:bg-[#0a0a0a] border-r border-[#e5e5e5] dark:border-[#333] p-6 pt-20 overflow-y-auto
          transition-transform duration-200
          md:sticky md:top-16 md:h-[calc(100vh-64px)] md:translate-x-0 md:z-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <DocsSidebar />
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 px-6 md:px-12 py-10">
        <div className="max-w-3xl">
          {children}
        </div>
      </main>
    </div>
  );
}
