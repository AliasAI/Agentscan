import { EndpointBlock } from '@/components/docs/EndpointBlock';

export const metadata = {
  title: 'Networks API - Agentscan Docs',
  description: 'API endpoints for supported blockchain networks and sync status',
};

export default function NetworksApiPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">Networks API</h1>
      <p className="text-[#525252] dark:text-[#a1a1a6] mb-8">
        Query supported blockchain networks, their configuration, agent counts, and sync status.
        Agentscan currently indexes 21 mainnet networks.
      </p>

      <EndpointBlock
        method="GET"
        path="/api/networks"
        description="List all supported blockchain networks with chain IDs, explorer URLs, and contract addresses."
        params={[]}
        response={`[
  {
    "id": "ethereum",
    "name": "Ethereum",
    "chain_id": 1,
    "rpc_url": "https://...",
    "explorer_url": "https://etherscan.io",
    "contracts": {
      "identity": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      "reputation": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63"
    },
    "created_at": "2026-01-30T00:00:00Z"
  },
  {
    "id": "base",
    "name": "Base",
    "chain_id": 8453,
    "explorer_url": "https://basescan.org",
    "contracts": { ... }
  }
]`}
      />

      <EndpointBlock
        method="GET"
        path="/api/networks/stats"
        description="Networks with agent counts."
        params={[]}
        response={`[
  {
    "id": "ethereum",
    "name": "Ethereum",
    "chain_id": 1,
    "explorer_url": "https://etherscan.io",
    "agent_count": 450
  },
  {
    "id": "base",
    "name": "Base",
    "chain_id": 8453,
    "explorer_url": "https://basescan.org",
    "agent_count": 280
  }
]`}
      />

      <EndpointBlock
        method="GET"
        path="/api/sync/status"
        description="Current blockchain sync status across all networks."
        params={[]}
        response={`{
  "ethereum": {
    "network": "ethereum",
    "contract_address": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    "last_block": 12345678,
    "current_block": 12345700,
    "sync_lag": 22,
    "status": "idle",
    "last_synced_at": "2026-04-07T09:50:00Z"
  },
  "base": {
    "network": "base",
    "last_block": 9876543,
    "status": "idle"
  }
}`}
      />

      <h2 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-10 mb-3">Supported Networks</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-[#f5f5f5] dark:bg-[#1a1a1a]">
              <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Network</th>
              <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Chain ID</th>
              <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Key</th>
            </tr>
          </thead>
          <tbody className="text-[#525252] dark:text-[#a1a1a6]">
            {[
              ['Ethereum', '1', 'ethereum'],
              ['Base', '8453', 'base'],
              ['Arbitrum', '42161', 'arbitrum'],
              ['Polygon', '137', 'polygon'],
              ['Optimism', '10', 'optimism'],
              ['BNB Smart Chain', '56', 'bsc'],
              ['Avalanche', '43114', 'avalanche'],
              ['Linea', '59144', 'linea'],
              ['Scroll', '534352', 'scroll'],
              ['Celo', '42220', 'celo'],
              ['Gnosis', '100', 'gnosis'],
              ['Mantle', '5000', 'mantle'],
              ['Soneium', '1868', 'soneium'],
              ['XLayer', '196', 'xlayer'],
              ['Abstract', '2741', 'abstract'],
              ['MegaETH', '4326', 'megaeth'],
              ['Monad', '143', 'monad'],
              ['GOAT Network', '2345', 'goat'],
              ['Metis', '1088', 'metis'],
              ['SKALE', '1187947933', 'skale'],
              ['Taiko', '167000', 'taiko'],
            ].map(([name, chainId, key], i) => (
              <tr key={key} className={i % 2 === 1 ? 'bg-[#fafafa] dark:bg-[#111]' : ''}>
                <td className="px-4 py-2 border-b border-[#e5e5e5] dark:border-[#333]">{name}</td>
                <td className="px-4 py-2 font-mono text-xs border-b border-[#e5e5e5] dark:border-[#333]">{chainId}</td>
                <td className="px-4 py-2 font-mono text-xs border-b border-[#e5e5e5] dark:border-[#333]">{key}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
