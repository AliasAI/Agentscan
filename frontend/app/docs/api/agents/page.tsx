import { EndpointBlock } from '@/components/docs/EndpointBlock';

export const metadata = {
  title: 'Agents API - Agentscan Docs',
  description: 'API endpoints for searching, browsing, and retrieving AI agent data',
};

export default function AgentsApiPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">Agents API</h1>
      <p className="text-[#525252] dark:text-[#a1a1a6] mb-8">
        Search, browse, and retrieve detailed information about ERC-8004 AI agents across all supported networks.
      </p>

      <EndpointBlock
        method="GET"
        path="/api/agents"
        description="Search and list agents with comprehensive filtering, sorting, and pagination."
        params={[
          { name: 'page', type: 'integer', default: '1', description: 'Page number' },
          { name: 'page_size', type: 'integer', default: '20', description: 'Items per page (max 100)' },
          { name: 'search', type: 'string', description: 'Text search across name, description, address' },
          { name: 'network', type: 'string', description: 'Filter by network key (e.g. "ethereum", "base")' },
          { name: 'skill', type: 'string', description: 'Filter by OASF skill slug' },
          { name: 'domain', type: 'string', description: 'Filter by OASF domain slug' },
          { name: 'owner', type: 'string', description: 'Filter by owner wallet address' },
          { name: 'quality', type: 'string', default: 'all', description: '"all", "basic", or "verified"' },
          { name: 'reputation_min', type: 'number', description: 'Minimum reputation score' },
          { name: 'reputation_max', type: 'number', description: 'Maximum reputation score' },
          { name: 'has_reputation', type: 'boolean', description: 'Only agents with reputation data' },
          { name: 'has_endpoints', type: 'boolean', description: 'Only agents with endpoints' },
          { name: 'created_after', type: 'string', description: 'ISO date filter (e.g. "2026-01-01")' },
          { name: 'created_before', type: 'string', description: 'ISO date filter' },
          { name: 'sort_field', type: 'string', default: 'created_at', description: 'Sort by field' },
          { name: 'sort_order', type: 'string', default: 'desc', description: '"asc" or "desc"' },
        ]}
        response={`{
  "items": [
    {
      "id": "ethereum-1",
      "name": "MyAgent",
      "address": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      "token_id": 1,
      "network_id": "ethereum",
      "description": "An AI assistant agent",
      "reputation_score": 85.5,
      "owner_address": "0xabc...",
      "skills": ["nlp", "code-generation"],
      "domains": ["technology"],
      "status": "active",
      "created_at": "2026-01-30T12:00:00Z"
    }
  ],
  "total": 1200,
  "page": 1,
  "page_size": 20,
  "total_pages": 60
}`}
      />

      <EndpointBlock
        method="GET"
        path="/api/agents/{agent_id}"
        description="Get full details for a single agent, including metadata, on-chain data, OASF classification, and reputation."
        params={[
          { name: 'agent_id', type: 'string', required: true, description: 'Agent ID (e.g. "ethereum-1")' },
        ]}
        response={`{
  "id": "ethereum-1",
  "name": "MyAgent",
  "address": "0x8004...",
  "token_id": 1,
  "network_id": "ethereum",
  "description": "An AI assistant agent",
  "metadata_uri": "ipfs://Qm...",
  "reputation_score": 85.5,
  "owner_address": "0xabc...",
  "skills": ["nlp", "code-generation"],
  "domains": ["technology"],
  "on_chain_data": { ... },
  "status": "active",
  "sync_status": "synced",
  "created_at": "2026-01-30T12:00:00Z",
  "synced_at": "2026-04-07T10:00:00Z"
}`}
      />

      <EndpointBlock
        method="GET"
        path="/api/agents/similar/{agent_id}"
        description="Find agents with shared skills or domains."
        params={[
          { name: 'agent_id', type: 'string', required: true, description: 'Agent ID to find similar agents for' },
          { name: 'limit', type: 'integer', default: '10', description: 'Max results (1-50)' },
        ]}
        response={`[
  {
    "id": "base-5",
    "name": "SimilarAgent",
    "skills": ["nlp"],
    "domains": ["technology"],
    "reputation_score": 72.0,
    ...
  }
]`}
      />

      <EndpointBlock
        method="GET"
        path="/api/agents/trending"
        description="Get top-ranked, featured, and trending agents."
        params={[
          { name: 'limit', type: 'integer', default: '5', description: 'Max results per category (1-20)' },
        ]}
        response={`{
  "top_ranked": [ ... ],
  "featured": [ ... ],
  "trending": [ ... ]
}`}
      />

      <EndpointBlock
        method="GET"
        path="/api/agents/by-owner/{owner_address}"
        description="Get all agents owned by a specific wallet address with cross-network summary."
        params={[
          { name: 'owner_address', type: 'string', required: true, description: 'Owner wallet address' },
          { name: 'page', type: 'integer', default: '1', description: 'Page number' },
          { name: 'page_size', type: 'integer', default: '50', description: 'Items per page (max 100)' },
        ]}
        response={`{
  "owner": "0xabc...",
  "summary": {
    "total_agents": 5,
    "networks": ["ethereum", "base"],
    "average_reputation": 78.3
  },
  "agents": [ ... ],
  "page": 1,
  "page_size": 50
}`}
      />

      <EndpointBlock
        method="GET"
        path="/api/agents/featured"
        description="Get featured agents (curated selection)."
        params={[]}
        response={`[
  {
    "id": "ethereum-42",
    "name": "FeaturedAgent",
    ...
  }
]`}
      />
    </div>
  );
}
