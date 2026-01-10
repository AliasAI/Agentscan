/**
 * ERC-8004 Identity Registry contract configuration
 *
 * Contract addresses match backend/src/core/networks_config.py
 */

import type { Address, Abi } from 'viem'

// Identity Registry ABI - from IdentityRegistryUpgradeable contract
// Updated: Jan 2026 Test Net deployment
export const IDENTITY_REGISTRY_ABI = [
  // Register new agent - returns token ID (multiple overloads available)
  {
    inputs: [{ name: 'agentURI', type: 'string' }],
    name: 'register',
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Update metadata URI (renamed from setTokenURI)
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newURI', type: 'string' },
    ],
    name: 'setAgentURI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // View functions
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events (updated parameter names in Jan 2026)
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: false, name: 'agentURI', type: 'string' },
      { indexed: true, name: 'owner', type: 'address' },
    ],
    name: 'Registered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: false, name: 'newURI', type: 'string' },
      { indexed: true, name: 'updatedBy', type: 'address' },
    ],
    name: 'URIUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
  // New: On-chain metadata
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'indexedMetadataKey', type: 'string' },
      { indexed: false, name: 'metadataKey', type: 'string' },
      { indexed: false, name: 'metadataValue', type: 'bytes' },
    ],
    name: 'MetadataSet',
    type: 'event',
  },
] as const satisfies Abi

// Contract addresses per chain - matches backend networks_config.py
// Updated: Jan 2026 Test Net deployment
export const IDENTITY_CONTRACTS: Record<number, Address> = {
  11155111: '0x8004A818BFB912233c491871b3d84c89A494BD9e', // Sepolia (Jan 2026)
  // Other networks pending deployment (Jan 2026)
  // 84532: '', // Base Sepolia - to be deployed
  // 59141: '', // Linea Sepolia - to be deployed
  // 80002: '', // Polygon Amoy - to be deployed
  // 296: '', // Hedera Testnet - to be deployed
}

// Get contract address for a chain
export function getIdentityContract(chainId: number): Address | undefined {
  return IDENTITY_CONTRACTS[chainId]
}

// Block explorer URLs for transaction links
// Updated: Jan 2026 Test Net deployment
export const BLOCK_EXPLORERS: Record<number, string> = {
  11155111: 'https://sepolia.etherscan.io',
  // Other networks pending deployment
  84532: 'https://sepolia.basescan.org',
  59141: 'https://sepolia.lineascan.build',
  80002: 'https://amoy.polygonscan.com',
  296: 'https://hashscan.io/testnet',
}

// Get transaction URL
export function getTransactionUrl(chainId: number, txHash: string): string {
  const explorer = BLOCK_EXPLORERS[chainId] || 'https://etherscan.io'
  return `${explorer}/tx/${txHash}`
}
