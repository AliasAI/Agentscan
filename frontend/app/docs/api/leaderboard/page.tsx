import { EndpointBlock } from '@/components/docs/EndpointBlock';

export const metadata = {
  title: 'Leaderboard API - Agentscan Docs',
  description: 'Agent leaderboard ranked by composite scores',
};

export default function LeaderboardApiPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">Leaderboard API</h1>
      <p className="text-[#525252] dark:text-[#a1a1a6] mb-8">
        Agent rankings based on composite scores calculated from service quality, usage metrics, freshness, and profile completeness.
      </p>

      <EndpointBlock
        method="GET"
        path="/api/leaderboard"
        description="Get paginated agent leaderboard with composite score breakdown."
        params={[
          { name: 'page', type: 'integer', default: '1', description: 'Page number' },
          { name: 'page_size', type: 'integer', default: '20', description: 'Items per page (max 100)' },
          { name: 'network', type: 'string', description: 'Filter by network' },
          { name: 'sort_by', type: 'string', default: 'score', description: 'Sort by: "score", "service", "usage", "freshness", "profile"' },
        ]}
        response={`{
  "items": [
    {
      "rank": 1,
      "agent_id": "ethereum-42",
      "agent_name": "TopAgent",
      "token_id": 42,
      "network_key": "ethereum",
      "score": 92.5,
      "service_score": 95.0,
      "usage_score": 88.0,
      "freshness_score": 90.0,
      "profile_score": 97.0,
      "reputation_score": 85.5,
      "reputation_count": 42,
      "has_working_endpoints": true
    }
  ],
  "total": 1200,
  "page": 1,
  "page_size": 20,
  "total_pages": 60
}`}
      />

      <h2 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-10 mb-3">Score Components</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-[#f5f5f5] dark:bg-[#1a1a1a]">
              <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Component</th>
              <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Description</th>
            </tr>
          </thead>
          <tbody className="text-[#525252] dark:text-[#a1a1a6]">
            <tr>
              <td className="px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">score</td>
              <td className="px-4 py-2.5 border-b border-[#e5e5e5] dark:border-[#333]">Overall composite score (weighted average of all components)</td>
            </tr>
            <tr className="bg-[#fafafa] dark:bg-[#111]">
              <td className="px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">service_score</td>
              <td className="px-4 py-2.5 border-b border-[#e5e5e5] dark:border-[#333]">Endpoint availability, response time, and service reliability</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">usage_score</td>
              <td className="px-4 py-2.5 border-b border-[#e5e5e5] dark:border-[#333]">Reputation feedback count and on-chain interaction volume</td>
            </tr>
            <tr className="bg-[#fafafa] dark:bg-[#111]">
              <td className="px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">freshness_score</td>
              <td className="px-4 py-2.5 border-b border-[#e5e5e5] dark:border-[#333]">Recency of registration and latest activity</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium">profile_score</td>
              <td className="px-4 py-2.5">Completeness of metadata, description, skills, and domains</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
