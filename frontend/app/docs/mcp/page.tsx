import Link from 'next/link';
import { CodeBlock } from '@/components/docs/CodeBlock';

export const metadata = {
  title: 'MCP Server - Agentscan Docs',
  description: 'Connect Agentscan to AI assistants via the Model Context Protocol',
};

export default function McpOverviewPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
        MCP Server
      </h1>
      <p className="text-[#525252] dark:text-[#a1a1a6] mb-8 leading-relaxed">
        The Agentscan MCP (Model Context Protocol) server lets AI assistants like Claude, Cursor, and Windsurf
        query the ERC-8004 agent ecosystem directly. It provides 22 tools across 6 categories.
      </p>

      <Section title="What is MCP?">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6]">
          The{' '}
          <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#0a0a0a] dark:hover:text-[#fafafa]">
            Model Context Protocol
          </a>{' '}
          is an open standard that allows AI applications to connect to external data sources and tools.
          The Agentscan MCP server exposes the full Agentscan API as structured tools that any MCP-compatible client can use.
        </p>
      </Section>

      <Section title="Installation">
        <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">Option 1: npx (recommended)</h3>
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-3">
          No installation needed. Configure your MCP client to run:
        </p>
        <CodeBlock code="npx -y @anthropic/agentscan-mcp-server" language="bash" />

        <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2 mt-6">Option 2: Global install</h3>
        <CodeBlock code="npm install -g @anthropic/agentscan-mcp-server" language="bash" />
      </Section>

      <Section title="Claude Desktop Configuration">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-3">
          Add this to your Claude Desktop configuration file:
        </p>
        <CodeBlock
          title="claude_desktop_config.json"
          language="json"
          code={`{
  "mcpServers": {
    "agentscan": {
      "command": "npx",
      "args": ["-y", "@anthropic/agentscan-mcp-server"]
    }
  }
}`}
        />
        <p className="text-sm text-[#6e6e73] dark:text-[#86868b] mt-3">
          Config file location: <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-xs font-mono">~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS)
          or <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-xs font-mono">%APPDATA%\Claude\claude_desktop_config.json</code> (Windows)
        </p>
      </Section>

      <Section title="Environment Variables">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[#f5f5f5] dark:bg-[#1a1a1a]">
                <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Variable</th>
                <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Default</th>
                <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 font-mono text-xs border-b border-[#e5e5e5] dark:border-[#333]">AGENTSCAN_API_URL</td>
                <td className="px-4 py-2 text-[#6e6e73] border-b border-[#e5e5e5] dark:border-[#333]">https://agentscan.info</td>
                <td className="px-4 py-2 text-[#525252] dark:text-[#a1a1a6] border-b border-[#e5e5e5] dark:border-[#333]">Base URL for the Agentscan API</td>
              </tr>
              <tr className="bg-[#fafafa] dark:bg-[#111]">
                <td className="px-4 py-2 font-mono text-xs">AGENTSCAN_DEFAULT_CHAIN</td>
                <td className="px-4 py-2 text-[#6e6e73]">(none)</td>
                <td className="px-4 py-2 text-[#525252] dark:text-[#a1a1a6]">Default network filter for all queries</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Tool Categories">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { name: 'Search & Discovery', count: 4, desc: 'Search, find similar, trending, leaderboard' },
            { name: 'Agent Details', count: 6, desc: 'Metadata, reputation, feedbacks, activities, health, transactions' },
            { name: 'Owner Portfolio', count: 1, desc: 'Cross-network portfolio by wallet address' },
            { name: 'Platform Analytics', count: 6, desc: 'Stats, trends, overview, distribution, ranking, activities' },
            { name: 'Networks', count: 2, desc: 'Chain list, endpoint health stats' },
            { name: 'Taxonomy', count: 3, desc: 'OASF distribution, skills list, domains list' },
          ].map((cat) => (
            <div key={cat.name} className="p-4 rounded-lg border border-[#e5e5e5] dark:border-[#333]">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">{cat.name}</h3>
                <span className="text-xs text-[#6e6e73] dark:text-[#86868b] bg-[#f5f5f5] dark:bg-[#1a1a1a] px-2 py-0.5 rounded-full">{cat.count} tools</span>
              </div>
              <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">{cat.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mt-4">
          See the full{' '}
          <Link href="/docs/mcp/tools" className="underline hover:text-[#0a0a0a] dark:hover:text-[#fafafa]">
            Tools Reference
          </Link>{' '}
          for detailed parameters and usage examples.
        </p>
      </Section>

      <Section title="Example Prompts">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-3">
          Once connected, you can ask your AI assistant questions like:
        </p>
        <ul className="space-y-2 text-sm text-[#525252] dark:text-[#a1a1a6]">
          {[
            'Find AI agents that specialize in NLP on Ethereum',
            'Show me the top-ranked agents by reputation score',
            'What are the most popular skills among registered agents?',
            'Check the endpoint health of agent ethereum-42',
            'How many agents are registered on Base vs Arbitrum?',
            'Show me the portfolio of wallet 0xabc...',
          ].map((prompt) => (
            <li key={prompt} className="flex items-start gap-2">
              <span className="text-[#6e6e73] mt-0.5">-</span>
              <span>&quot;{prompt}&quot;</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-3">{title}</h2>
      {children}
    </section>
  );
}
