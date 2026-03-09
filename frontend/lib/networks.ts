/**
 * Unified network configuration for the frontend
 * This is the single source of truth for all network-related data
 *
 * When adding a new network:
 * 1. Add entry to NETWORKS object below
 * 2. Add icon component to NetworkIcons.tsx (or use 'default' iconType)
 */

export interface NetworkConfig {
  id: string
  name: string
  chainId: number
  explorerUrl: string
  contracts: {
    identity: string
    reputation: string
  }
  iconType: string // Maps to icon component in NetworkIcons.tsx
  enabled: boolean
}

// Shared contract addresses (CREATE2 deterministic deployment)
const MAINNET_CONTRACTS = {
  identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
}
const TESTNET_CONTRACTS = {
  identity: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
}

/**
 * All supported networks
 * Keep in sync with backend/src/core/networks_config.py
 */
export const NETWORKS: Record<string, NetworkConfig> = {
  // === Mainnets (21 networks) ===
  abstract: {
    id: 'abstract', name: 'Abstract', chainId: 2741,
    explorerUrl: 'https://abscan.org',
    contracts: MAINNET_CONTRACTS, iconType: 'abstract', enabled: true,
  },
  arbitrum: {
    id: 'arbitrum', name: 'Arbitrum', chainId: 42161,
    explorerUrl: 'https://arbiscan.io',
    contracts: MAINNET_CONTRACTS, iconType: 'arbitrum', enabled: true,
  },
  avalanche: {
    id: 'avalanche', name: 'Avalanche', chainId: 43114,
    explorerUrl: 'https://snowscan.xyz',
    contracts: MAINNET_CONTRACTS, iconType: 'avalanche', enabled: true,
  },
  base: {
    id: 'base', name: 'Base', chainId: 8453,
    explorerUrl: 'https://basescan.org',
    contracts: MAINNET_CONTRACTS, iconType: 'base', enabled: true,
  },
  'bsc-1': {
    id: 'bsc-1', name: 'BNB Smart Chain', chainId: 56,
    explorerUrl: 'https://bscscan.com',
    contracts: MAINNET_CONTRACTS, iconType: 'bsc', enabled: true,
  },
  celo: {
    id: 'celo', name: 'Celo', chainId: 42220,
    explorerUrl: 'https://celoscan.io',
    contracts: MAINNET_CONTRACTS, iconType: 'celo', enabled: true,
  },
  ethereum: {
    id: 'ethereum', name: 'Ethereum', chainId: 1,
    explorerUrl: 'https://etherscan.io',
    contracts: MAINNET_CONTRACTS, iconType: 'ethereum', enabled: true,
  },
  gnosis: {
    id: 'gnosis', name: 'Gnosis', chainId: 100,
    explorerUrl: 'https://gnosisscan.io',
    contracts: MAINNET_CONTRACTS, iconType: 'gnosis', enabled: true,
  },
  goat: {
    id: 'goat', name: 'GOAT Network', chainId: 2345,
    explorerUrl: 'https://explorer.goat.network',
    contracts: MAINNET_CONTRACTS, iconType: 'default', enabled: true,
  },
  linea: {
    id: 'linea', name: 'Linea', chainId: 59144,
    explorerUrl: 'https://lineascan.build',
    contracts: MAINNET_CONTRACTS, iconType: 'linea', enabled: true,
  },
  mantle: {
    id: 'mantle', name: 'Mantle', chainId: 5000,
    explorerUrl: 'https://mantlescan.xyz',
    contracts: MAINNET_CONTRACTS, iconType: 'mantle', enabled: true,
  },
  megaeth: {
    id: 'megaeth', name: 'MegaETH', chainId: 4326,
    explorerUrl: 'https://megaeth.blockscout.com',
    contracts: MAINNET_CONTRACTS, iconType: 'megaeth', enabled: true,
  },
  metis: {
    id: 'metis', name: 'Metis', chainId: 1088,
    explorerUrl: 'https://andromeda-explorer.metis.io',
    contracts: MAINNET_CONTRACTS, iconType: 'metis', enabled: true,
  },
  monad: {
    id: 'monad', name: 'Monad', chainId: 143,
    explorerUrl: 'https://monadscan.com',
    contracts: MAINNET_CONTRACTS, iconType: 'monad', enabled: true,
  },
  optimism: {
    id: 'optimism', name: 'Optimism', chainId: 10,
    explorerUrl: 'https://optimistic.etherscan.io',
    contracts: MAINNET_CONTRACTS, iconType: 'optimism', enabled: true,
  },
  polygon: {
    id: 'polygon', name: 'Polygon', chainId: 137,
    explorerUrl: 'https://polygonscan.com',
    contracts: MAINNET_CONTRACTS, iconType: 'polygon', enabled: true,
  },
  scroll: {
    id: 'scroll', name: 'Scroll', chainId: 534352,
    explorerUrl: 'https://scrollscan.com',
    contracts: MAINNET_CONTRACTS, iconType: 'scroll', enabled: true,
  },
  skale: {
    id: 'skale', name: 'SKALE', chainId: 1187947933,
    explorerUrl: 'https://skale-base-explorer.skalenodes.com',
    contracts: MAINNET_CONTRACTS, iconType: 'default', enabled: true,
  },
  soneium: {
    id: 'soneium', name: 'Soneium', chainId: 1868,
    explorerUrl: 'https://soneium.blockscout.com',
    contracts: MAINNET_CONTRACTS, iconType: 'soneium', enabled: true,
  },
  taiko: {
    id: 'taiko', name: 'Taiko', chainId: 167000,
    explorerUrl: 'https://taikoscan.io',
    contracts: MAINNET_CONTRACTS, iconType: 'taiko', enabled: true,
  },
  xlayer: {
    id: 'xlayer', name: 'XLayer', chainId: 196,
    explorerUrl: 'https://www.oklink.com/xlayer',
    contracts: MAINNET_CONTRACTS, iconType: 'xlayer', enabled: true,
  },
  // === Testnet (disabled) ===
  sepolia: {
    id: 'sepolia', name: 'Sepolia', chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io',
    contracts: TESTNET_CONTRACTS, iconType: 'ethereum', enabled: false,
  },
}

// Create lookup by network name for backwards compatibility
export const NETWORKS_BY_NAME: Record<string, NetworkConfig> = Object.values(
  NETWORKS
).reduce(
  (acc, network) => {
    acc[network.name] = network
    return acc
  },
  {} as Record<string, NetworkConfig>
)

/**
 * Get network config by name
 */
export function getNetworkByName(name: string): NetworkConfig | undefined {
  return NETWORKS_BY_NAME[name]
}

/**
 * Get network config by id
 */
export function getNetworkById(id: string): NetworkConfig | undefined {
  return NETWORKS[id]
}

/**
 * Get explorer URL for a network
 */
export function getExplorerUrl(networkName: string): string {
  return NETWORKS_BY_NAME[networkName]?.explorerUrl || 'https://etherscan.io'
}

/**
 * Get identity contract address for a network
 */
export function getContractAddress(networkName: string): string {
  return NETWORKS_BY_NAME[networkName]?.contracts.identity || ''
}

/**
 * Generate NFT explorer link
 */
export function getNftExplorerUrl(
  networkName: string,
  tokenId: number
): string {
  const network = NETWORKS_BY_NAME[networkName]
  if (!network) return '#'
  return `${network.explorerUrl}/nft/${network.contracts.identity}/${tokenId}`
}

/**
 * Generate transaction explorer link
 */
export function getTxExplorerUrl(
  networkName: string | undefined,
  txHash: string
): string {
  const explorerUrl = getExplorerUrl(networkName || '')
  return `${explorerUrl}/tx/${txHash}`
}

/**
 * Get icon type for a network (used by NetworkIcons component)
 */
export function getNetworkIconType(networkName: string): string {
  return NETWORKS_BY_NAME[networkName]?.iconType || NETWORKS[networkName]?.iconType || 'default'
}

/**
 * Get all enabled networks
 */
export function getEnabledNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS).filter((n) => n.enabled)
}
