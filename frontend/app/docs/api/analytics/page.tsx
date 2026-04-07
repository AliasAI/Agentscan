import { EndpointBlock } from '@/components/docs/EndpointBlock';

export const metadata = {
  title: 'Analytics & Stats API - Agentscan Docs',
  description: 'Platform statistics, registration trends, and analytics',
};

export default function AnalyticsApiPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">Analytics & Stats API</h1>
      <p className="text-[#525252] dark:text-[#a1a1a6] mb-8">
        Platform-level statistics, registration trends, and detailed analytics.
      </p>

      <h2 className="text-xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4">Platform Stats</h2>

      <EndpointBlock
        method="GET"
        path="/api/stats"
        description="Get platform-wide statistics including total agents, active agents, network count, and sync status."
        params={[]}
        response={`{
  "total_agents": 1200,
  "active_agents": 850,
  "total_networks": 20,
  "total_activities": 5600,
  "updated_at": "2026-04-07T10:00:00Z",
  "blockchain_sync": {
    "status": "idle",
    "last_block": 12345678,
    "current_block": 12345700
  },
  "multi_network_sync": {
    "ethereum": { "status": "idle", "last_block": 12345678 },
    "base": { "status": "idle", "last_block": 9876543 }
  }
}`}
      />

      <EndpointBlock
        method="GET"
        path="/api/stats/registration-trend"
        description="Daily agent registration counts over a configurable lookback period."
        params={[
          { name: 'days', type: 'integer', default: '30', description: 'Lookback days (1-365)' },
        ]}
        response={`{
  "data": [
    { "date": "2026-04-01", "count": 15 },
    { "date": "2026-04-02", "count": 22 },
    { "date": "2026-04-03", "count": 8 }
  ]
}`}
      />

      <h2 className="text-xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4 mt-10">Detailed Analytics</h2>

      <EndpointBlock
        method="GET"
        path="/api/analytics/overview"
        description="Comprehensive analytics: transaction stats, daily trends by type, network breakdown, and fees."
        params={[
          { name: 'days', type: 'integer', default: '30', description: 'Lookback days (max 365)' },
          { name: 'limit', type: 'integer', default: '10', description: 'Limit for sub-queries (max 100)' },
          { name: 'network', type: 'string', description: 'Filter by network' },
        ]}
        response={`{
  "stats": {
    "total_transactions": 8500,
    "total_registrations": 1200,
    "total_feedbacks": 4200,
    "total_fee_eth": "12.5"
  },
  "trend_data": [
    { "date": "2026-04-01", "registrations": 15, "feedbacks": 42 }
  ],
  "network_stats": [
    { "network": "ethereum", "transactions": 3200, "agents": 450 }
  ],
  "recent_activities": [ ... ]
}`}
      />

      <EndpointBlock
        method="GET"
        path="/api/analytics/agent/{agent_id}/transactions"
        description="Transaction history for a specific agent with gas/fee breakdown."
        params={[
          { name: 'agent_id', type: 'string', required: true, description: 'Agent ID' },
        ]}
        response={`{
  "agent_id": "ethereum-1",
  "agent_name": "MyAgent",
  "total_transactions": 25,
  "transactions_by_type": {
    "registration": 1,
    "feedback": 20,
    "uri_update": 4
  },
  "first_activity": "2026-01-30T12:00:00Z",
  "latest_activity": "2026-04-05T08:30:00Z"
}`}
      />

      <h2 className="text-xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4 mt-10">Activities</h2>

      <EndpointBlock
        method="GET"
        path="/api/activities"
        description="Platform-wide activity feed (registrations, reputation updates, validations)."
        params={[
          { name: 'page', type: 'integer', default: '1', description: 'Page number' },
          { name: 'page_size', type: 'integer', default: '20', description: 'Items per page (max 100)' },
        ]}
        response={`{
  "items": [
    {
      "id": "act-123",
      "type": "registration",
      "agent_id": "ethereum-1",
      "agent_name": "MyAgent",
      "network_id": "ethereum",
      "tx_hash": "0x...",
      "block_number": 12345678,
      "created_at": "2026-04-07T09:00:00Z"
    }
  ],
  "total": 5600,
  "page": 1,
  "page_size": 20,
  "total_pages": 280
}`}
      />

      <EndpointBlock
        method="GET"
        path="/api/activities/agent/{agent_id}"
        description="Activity history for a specific agent."
        params={[
          { name: 'agent_id', type: 'string', required: true, description: 'Agent ID' },
        ]}
        response={`[
  {
    "type": "registration",
    "tx_hash": "0x...",
    "block_number": 12345678,
    "created_at": "2026-01-30T12:00:00Z"
  },
  {
    "type": "feedback",
    "tx_hash": "0x...",
    "block_number": 12345700,
    "created_at": "2026-02-15T14:00:00Z"
  }
]`}
      />
    </div>
  );
}
