import Link from 'next/link';

export const metadata = {
  title: 'Documentation - Agentscan',
  description: 'Agentscan API and MCP documentation for the ERC-8004 AI Agent Explorer',
};

export default function DocsIntroPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
        Agentscan Documentation
      </h1>
      <p className="text-lg text-[#525252] dark:text-[#a1a1a6] mb-8 leading-relaxed">
        Agentscan is the explorer for{' '}
        <a href="https://eips.ethereum.org/EIPS/eip-8004" className="underline hover:text-[#0a0a0a] dark:hover:text-[#fafafa]" target="_blank" rel="noopener noreferrer">
          ERC-8004
        </a>{' '}
        on-chain AI agents. It indexes agent registrations, reputation feedback, and metadata across 21 mainnet blockchain networks.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        <QuickLink
          href="/docs/getting-started"
          title="Getting Started"
          description="Base URL, response format, pagination, and your first API call."
        />
        <QuickLink
          href="/docs/mcp"
          title="MCP Server"
          description="Connect Agentscan to Claude, Cursor, or any MCP-compatible AI client."
        />
        <QuickLink
          href="/docs/api/agents"
          title="REST API"
          description="48 endpoints for agents, reputation, analytics, networks, and more."
        />
        <QuickLink
          href="/docs/erc-8004"
          title="ERC-8004 Protocol"
          description="Identity Registry, Reputation Registry, and contract addresses."
        />
      </div>

      <h2 className="text-xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
        Platform Overview
      </h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg overflow-hidden">
          <tbody>
            <Row label="Networks" value="21 mainnet chains (Ethereum, Base, Arbitrum, Polygon, ...)" />
            <Row label="REST Endpoints" value="48 public endpoints, no API key required" />
            <Row label="MCP Tools" value="22 tools for AI assistant integration" />
            <Row label="Protocol" value="ERC-8004 (Identity + Reputation registries)" />
            <Row label="Classification" value="OASF v0.8.0 (136 skills, 204 domains)" />
            <Row label="Data Source" value="On-chain events via Web3.py + QuikNode RPC" />
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
        API Categories
      </h2>
      <div className="space-y-3 text-sm">
        <CategoryLink href="/docs/api/agents" label="Agents" description="Search, browse, and get detailed agent information" />
        <CategoryLink href="/docs/api/feedback" label="Feedback & Reputation" description="Reputation summaries, feedback items, validations" />
        <CategoryLink href="/docs/api/analytics" label="Analytics & Stats" description="Platform statistics, registration trends, network distribution" />
        <CategoryLink href="/docs/api/networks" label="Networks" description="Supported chains, sync status, contract addresses" />
        <CategoryLink href="/docs/api/taxonomy" label="Taxonomy" description="OASF skill and domain classification" />
        <CategoryLink href="/docs/api/endpoint-health" label="Endpoint Health" description="Agent endpoint monitoring and health reports" />
        <CategoryLink href="/docs/api/leaderboard" label="Leaderboard" description="Agent rankings by composite scores" />
      </div>
    </div>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="block p-5 rounded-lg border border-[#e5e5e5] dark:border-[#333] hover:border-[#0a0a0a] dark:hover:border-[#fafafa] transition-colors group"
    >
      <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-1 group-hover:underline">{title}</h3>
      <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">{description}</p>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-[#e5e5e5] dark:border-[#333] last:border-0">
      <td className="px-4 py-2.5 font-medium text-[#0a0a0a] dark:text-[#fafafa] whitespace-nowrap w-40">{label}</td>
      <td className="px-4 py-2.5 text-[#525252] dark:text-[#a1a1a6]">{value}</td>
    </tr>
  );
}

function CategoryLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] transition-colors group"
    >
      <div>
        <span className="text-[#0a0a0a] dark:text-[#fafafa] font-medium group-hover:underline">{label}</span>
        <span className="text-[#6e6e73] dark:text-[#86868b] ml-3">{description}</span>
      </div>
      <svg className="w-4 h-4 text-[#6e6e73]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
