import { ParamsTable } from '@/components/docs/ParamsTable';

export const metadata = {
  title: 'MCP Tools Reference - Agentscan Docs',
  description: 'Complete reference for Agentscan MCP tools',
};

interface ToolDef {
  name: string;
  description: string;
  params: { name: string; type: string; required?: boolean; default?: string; description: string }[];
}

const searchTools: ToolDef[] = [
  {
    name: 'search_agents',
    description: 'Full-featured agent search with text, network, quality tier, reputation range filters, sorting, and pagination.',
    params: [
      { name: 'query', type: 'string', description: 'Text search (name, description, address)' },
      { name: 'network', type: 'string', description: 'Filter by network key (e.g. "ethereum", "base")' },
      { name: 'quality', type: 'string', default: 'all', description: 'Quality tier: "all", "basic", "verified"' },
      { name: 'reputation_min', type: 'number', description: 'Minimum reputation score' },
      { name: 'reputation_max', type: 'number', description: 'Maximum reputation score' },
      { name: 'has_reputation', type: 'boolean', description: 'Only agents with reputation data' },
      { name: 'sort_field', type: 'string', default: 'created_at', description: 'Sort field' },
      { name: 'sort_order', type: 'string', default: 'desc', description: '"asc" or "desc"' },
      { name: 'page', type: 'integer', default: '1', description: 'Page number' },
      { name: 'page_size', type: 'integer', default: '20', description: 'Items per page (max 100)' },
    ],
  },
  {
    name: 'get_trending_agents',
    description: 'Get top-ranked, featured, and trending agents.',
    params: [
      { name: 'limit', type: 'integer', default: '5', description: 'Max results per category (1-20)' },
    ],
  },
  {
    name: 'get_leaderboard',
    description: 'Agent leaderboard ranked by composite scores (service, usage, freshness, profile).',
    params: [
      { name: 'page', type: 'integer', default: '1', description: 'Page number' },
      { name: 'page_size', type: 'integer', default: '20', description: 'Items per page (max 100)' },
      { name: 'network', type: 'string', description: 'Filter by network' },
      { name: 'sort_by', type: 'string', default: 'score', description: '"score", "service", "usage", "freshness", "profile"' },
    ],
  },
];

const detailTools: ToolDef[] = [
  {
    name: 'get_agent',
    description: 'Full agent details including metadata, OASF classification, reputation, owner, endpoints, and on-chain data.',
    params: [
      { name: 'agent_id', type: 'string', required: true, description: 'Agent ID (e.g. "ethereum-1")' },
    ],
  },
  {
    name: 'get_agent_reputation',
    description: 'Reputation summary: feedback count, average score, and validation count.',
    params: [
      { name: 'agent_id', type: 'string', required: true, description: 'Agent ID' },
    ],
  },
  {
    name: 'get_agent_feedbacks',
    description: 'Individual feedback items with scores, tags, client addresses, and tx hashes.',
    params: [
      { name: 'agent_id', type: 'string', required: true, description: 'Agent ID' },
      { name: 'page', type: 'integer', default: '1', description: 'Page number' },
      { name: 'page_size', type: 'integer', default: '10', description: 'Items per page (max 50)' },
    ],
  },
  {
    name: 'get_agent_activities',
    description: 'On-chain event history (registrations, reputation updates, validations).',
    params: [
      { name: 'agent_id', type: 'string', required: true, description: 'Agent ID' },
    ],
  },
  {
    name: 'get_agent_endpoint_health',
    description: 'Live endpoint health checks with response times and HTTP status codes.',
    params: [
      { name: 'agent_id', type: 'string', required: true, description: 'Agent ID' },
    ],
  },
  {
    name: 'get_agent_transactions',
    description: 'Transaction history with gas/fee breakdown, types, and first/latest activity.',
    params: [
      { name: 'agent_id', type: 'string', required: true, description: 'Agent ID' },
    ],
  },
];

const analyticsTools: ToolDef[] = [
  {
    name: 'get_stats',
    description: 'Platform statistics: total agents, active agents, networks, sync status.',
    params: [],
  },
  {
    name: 'get_registration_trend',
    description: 'Daily agent registration counts over a configurable lookback period.',
    params: [
      { name: 'days', type: 'integer', default: '30', description: 'Lookback period (max 365)' },
    ],
  },
  {
    name: 'get_analytics_overview',
    description: 'Transaction stats, daily trends by type, network breakdown, and fees.',
    params: [
      { name: 'days', type: 'integer', default: '30', description: 'Lookback period (max 365)' },
      { name: 'network', type: 'string', description: 'Filter by network' },
    ],
  },
  {
    name: 'get_recent_activities',
    description: 'Platform-wide activity feed with pagination.',
    params: [
      { name: 'page', type: 'integer', default: '1', description: 'Page number' },
      { name: 'page_size', type: 'integer', default: '20', description: 'Items per page (max 100)' },
    ],
  },
];

const networkTools: ToolDef[] = [
  {
    name: 'list_networks',
    description: 'All supported blockchain networks with chain IDs, explorer URLs, and contract addresses.',
    params: [],
  },
  {
    name: 'get_endpoint_health_stats',
    description: 'Platform-wide endpoint health overview with top agents by reputation.',
    params: [
      { name: 'network', type: 'string', description: 'Filter by network' },
    ],
  },
];

const taxonomyTools: ToolDef[] = [
  {
    name: 'get_taxonomy_distribution',
    description: 'OASF skill and domain distribution with agent counts and percentages.',
    params: [],
  },
  {
    name: 'list_taxonomy_skills',
    description: 'All 136 OASF skill categories with display names and slugs.',
    params: [],
  },
  {
    name: 'list_taxonomy_domains',
    description: 'All OASF domain categories with display names and slugs.',
    params: [],
  },
];

const categories = [
  { title: 'Search & Discovery', tools: searchTools },
  { title: 'Agent Details', tools: detailTools },
  { title: 'Platform Analytics', tools: analyticsTools },
  { title: 'Networks', tools: networkTools },
  { title: 'Taxonomy', tools: taxonomyTools },
];

export default function McpToolsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
        MCP Tools Reference
      </h1>
      <p className="text-[#525252] dark:text-[#a1a1a6] mb-8">
        Complete reference for all tools available in the Agentscan MCP server.
      </p>

      {/* Table of contents */}
      <div className="mb-10 p-4 rounded-lg border border-[#e5e5e5] dark:border-[#333]">
        <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">On this page</h2>
        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat.title}>
              <a href={`#${cat.title.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm text-[#525252] dark:text-[#a1a1a6] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]">
                {cat.title} ({cat.tools.length})
              </a>
            </li>
          ))}
        </ul>
      </div>

      {categories.map((cat) => (
        <section key={cat.title} className="mb-12">
          <h2 id={cat.title.toLowerCase().replace(/\s+/g, '-')} className="text-xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-6 scroll-mt-20">
            {cat.title}
          </h2>
          {cat.tools.map((tool) => (
            <ToolBlock key={tool.name} tool={tool} />
          ))}
        </section>
      ))}
    </div>
  );
}

function ToolBlock({ tool }: { tool: ToolDef }) {
  return (
    <div className="mb-8 border border-[#e5e5e5] dark:border-[#333] rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-[#f5f5f5] dark:bg-[#1a1a1a] border-b border-[#e5e5e5] dark:border-[#333]">
        <code className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">{tool.name}</code>
      </div>
      <div className="p-4">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-3">{tool.description}</p>
        {tool.params.length > 0 ? (
          <ParamsTable params={tool.params} />
        ) : (
          <p className="text-xs text-[#6e6e73] dark:text-[#86868b] italic">No parameters required.</p>
        )}
      </div>
    </div>
  );
}
