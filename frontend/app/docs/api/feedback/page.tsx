import { EndpointBlock } from '@/components/docs/EndpointBlock';

export const metadata = {
  title: 'Feedback & Reputation API - Agentscan Docs',
  description: 'API endpoints for agent reputation summaries, feedback items, and validations',
};

export default function FeedbackApiPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">Feedback & Reputation API</h1>
      <p className="text-[#525252] dark:text-[#a1a1a6] mb-8">
        Query agent reputation summaries, individual feedback items, and validation records from the ERC-8004 Reputation Registry.
      </p>

      <h2 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">Feedback Value System</h2>
      <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-6">
        The ERC-8004 mainnet uses a flexible <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-xs font-mono">value</code> +{' '}
        <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-xs font-mono">valueDecimals</code> system instead of a fixed 0-100 score.
        For example, an uptime of 99.77% is stored as value=9977, valueDecimals=2.
      </p>

      <EndpointBlock
        method="GET"
        path="/api/agents/{agent_id}/reputation-summary"
        description="Get an agent's reputation summary including feedback count, average score, and validation count."
        params={[
          { name: 'agent_id', type: 'string', required: true, description: 'Agent ID' },
        ]}
        response={`{
  "feedback_count": 42,
  "average_score": 85.5,
  "validation_count": 3
}`}
      />

      <EndpointBlock
        method="GET"
        path="/api/agents/{agent_id}/feedbacks"
        description="Get paginated list of individual feedback items for an agent."
        params={[
          { name: 'agent_id', type: 'string', required: true, description: 'Agent ID' },
          { name: 'page', type: 'integer', default: '1', description: 'Page number' },
          { name: 'page_size', type: 'integer', default: '10', description: 'Items per page (max 50)' },
        ]}
        response={`{
  "items": [
    {
      "client_address": "0xdef...",
      "value": 87,
      "value_decimals": 0,
      "tag1": "starred",
      "tag2": "",
      "endpoint": "https://agent.example.com/api",
      "feedback_uri": "ipfs://Qm...",
      "feedback_hash": "0x...",
      "tx_hash": "0x...",
      "block_number": 12345678,
      "created_at": "2026-03-15T08:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 10,
  "total_pages": 5,
  "data_source": "on-chain"
}`}
      />

      <EndpointBlock
        method="GET"
        path="/api/agents/{agent_id}/validations"
        description="Get paginated list of validation records for an agent."
        params={[
          { name: 'agent_id', type: 'string', required: true, description: 'Agent ID' },
          { name: 'page', type: 'integer', default: '1', description: 'Page number' },
          { name: 'page_size', type: 'integer', default: '10', description: 'Items per page (max 50)' },
        ]}
        response={`{
  "items": [
    {
      "validator_address": "0x...",
      "validation_type": "endpoint_check",
      "result": true,
      "tx_hash": "0x...",
      "created_at": "2026-03-10T14:00:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}`}
      />

      <h2 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-10 mb-3">Standard tag1 Values</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-[#f5f5f5] dark:bg-[#1a1a1a]">
              <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">tag1</th>
              <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Measurement</th>
              <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Example</th>
            </tr>
          </thead>
          <tbody className="text-[#525252] dark:text-[#a1a1a6]">
            {[
              ['starred', 'Quality score (0-100)', 'value=87, decimals=0'],
              ['reachable', 'Reachability (binary)', 'value=1, decimals=0'],
              ['ownerVerified', 'Owner verification', 'value=1, decimals=0'],
              ['uptime', 'Uptime percentage', 'value=9977, decimals=2 (99.77%)'],
              ['successRate', 'Success rate', 'value=89, decimals=0'],
              ['responseTime', 'Response time (ms)', 'value=560, decimals=0'],
              ['revenues', 'Cumulative revenue', 'value=560, decimals=0'],
              ['tradingYield', 'Trading yield', 'value=-32, decimals=1 (-3.2%)'],
            ].map(([tag, measurement, example], i) => (
              <tr key={tag} className={i % 2 === 1 ? 'bg-[#fafafa] dark:bg-[#111]' : ''}>
                <td className="px-4 py-2 font-mono text-xs border-b border-[#e5e5e5] dark:border-[#333]">{tag}</td>
                <td className="px-4 py-2 border-b border-[#e5e5e5] dark:border-[#333]">{measurement}</td>
                <td className="px-4 py-2 border-b border-[#e5e5e5] dark:border-[#333]">{example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
