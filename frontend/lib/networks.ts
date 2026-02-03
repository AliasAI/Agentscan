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

/**
 * All supported networks
 * Keep in sync with backend/src/core/networks_config.py
 */
export const NETWORKS: Record<string, NetworkConfig> = {
  // === Mainnets ===
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum Mainnet',
    chainId: 1,
    explorerUrl: 'https://etherscan.io',
    contracts: {
      identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
      reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    },
    iconType: 'ethereum',
    enabled: true,
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon Mainnet',
    chainId: 137,
    explorerUrl: 'https://polygonscan.com',
    contracts: {
      // CREATE2 deterministic deployment - same addresses as Ethereum
      identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
      reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    },
    iconType: 'polygon',
    enabled: true,
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Smart Chain',
    chainId: 56,
    explorerUrl: 'https://bscscan.com',
    contracts: {
      // Vanity deployment - different addresses
      identity: '0x8004c274E3770d32dc1883ab5108b0eA28A854D5',
      reputation: '0x8004e9D54904EaAFc724A743Fea4387Fa632dc2D',
    },
    iconType: 'bsc',
    enabled: true,
  },
  // === Testnets ===
  sepolia: {
    id: 'sepolia',
    name: 'Sepolia',
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io',
    contracts: {
      identity: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
      reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    },
    iconType: 'ethereum', // Use Ethereum icon for Sepolia testnet
    enabled: false,
  },
  'base-sepolia': {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    chainId: 84532,
    explorerUrl: 'https://sepolia.basescan.org',
    contracts: {
      identity: '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb',
      reputation: '',
    },
    iconType: 'base',
    enabled: false,
  },
  'linea-sepolia': {
    id: 'linea-sepolia',
    name: 'Linea Sepolia',
    chainId: 59141,
    explorerUrl: 'https://sepolia.lineascan.build',
    contracts: {
      identity: '0x8004aa7C931bCE1233973a0C6A667f73F66282e7',
      reputation: '',
    },
    iconType: 'linea',
    enabled: false,
  },
  'hedera-testnet': {
    id: 'hedera-testnet',
    name: 'Hedera Testnet',
    chainId: 296,
    explorerUrl: 'https://hashscan.io/testnet',
    contracts: {
      identity: '0x0dDaa2de07deb24D5F0288ee29c3c57c4159DcC7',
      reputation: '',
    },
    iconType: 'hedera',
    enabled: false,
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
  return NETWORKS_BY_NAME[networkName]?.iconType || 'default'
}

/**
 * Get all enabled networks
 */
export function getEnabledNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS).filter((n) => n.enabled)
}
