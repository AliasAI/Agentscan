'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { label: 'Introduction', href: '/docs' },
  { label: 'Getting Started', href: '/docs/getting-started' },
  {
    label: 'MCP Server',
    children: [
      { label: 'Overview', href: '/docs/mcp' },
      { label: 'Tools Reference', href: '/docs/mcp/tools' },
    ],
  },
  {
    label: 'REST API',
    children: [
      { label: 'Agents', href: '/docs/api/agents' },
      { label: 'Feedback & Reputation', href: '/docs/api/feedback' },
      { label: 'Analytics & Stats', href: '/docs/api/analytics' },
      { label: 'Networks', href: '/docs/api/networks' },
      { label: 'Taxonomy', href: '/docs/api/taxonomy' },
      { label: 'Endpoint Health', href: '/docs/api/endpoint-health' },
      { label: 'Leaderboard', href: '/docs/api/leaderboard' },
    ],
  },
  { label: 'ERC-8004 Protocol', href: '/docs/erc-8004' },
];

function NavSection({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isChildActive = item.children?.some(
    (child) => child.href && (pathname === child.href || pathname?.startsWith(child.href + '/'))
  );
  const [open, setOpen] = useState(isChildActive ?? true);

  if (item.href) {
    const active = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={`block px-3 py-1.5 rounded-md text-[13px] transition-colors ${
          active
            ? 'bg-[#0a0a0a] text-white dark:bg-[#fafafa] dark:text-[#0a0a0a] font-medium'
            : 'text-[#525252] dark:text-[#a1a1a6] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a]'
        }`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-[13px] font-medium text-[#0a0a0a] dark:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] rounded-md transition-colors"
      >
        {item.label}
        <svg
          className={`w-3.5 h-3.5 text-[#6e6e73] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && item.children && (
        <div className="ml-3 mt-1 space-y-0.5 border-l border-[#e5e5e5] dark:border-[#333] pl-3">
          {item.children.map((child) => (
            <NavSection key={child.label} item={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocsSidebar({ className = '' }: { className?: string }) {
  return (
    <nav className={`space-y-1 ${className}`}>
      <div className="px-3 pb-2 mb-3 border-b border-[#e5e5e5] dark:border-[#333]">
        <h2 className="text-sm font-bold text-[#0a0a0a] dark:text-[#fafafa]">Documentation</h2>
      </div>
      {navigation.map((item) => (
        <NavSection key={item.label} item={item} />
      ))}
    </nav>
  );
}
