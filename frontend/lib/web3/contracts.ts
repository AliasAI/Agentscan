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
// Updated: Jan 2026 Mainnet deployment
export const IDENTITY_CONTRACTS: Record<number, Address> = {
  1: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432', // Ethereum Mainnet (Jan 2026)
  11155111: '0x8004A818BFB912233c491871b3d84c89A494BD9e', // Sepolia (for reference)
}

// Get contract address for a chain
export function getIdentityContract(chainId: number): Address | undefined {
  return IDENTITY_CONTRACTS[chainId]
}

// Block explorer URLs for transaction links
// Updated: Jan 2026 Mainnet deployment
export const BLOCK_EXPLORERS: Record<number, string> = {
  1: 'https://etherscan.io', // Ethereum Mainnet
  11155111: 'https://sepolia.etherscan.io', // Sepolia (for reference)
}

// Get transaction URL
export function getTransactionUrl(chainId: number, txHash: string): string {
  const explorer = BLOCK_EXPLORERS[chainId] || 'https://etherscan.io'
  return `${explorer}/tx/${txHash}`
}

// =============================================================================
// Reputation Registry Contract (Jan 2026 Update)
// =============================================================================

// Reputation Registry ABI - for submitting feedback/reviews
// Jan 2026 Update: feedbackAuth removed, any wallet can submit reviews
export const REPUTATION_REGISTRY_ABI = [
  // Submit feedback - no longer requires agent signature (Jan 2026)
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'score', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
    name: 'giveFeedback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Revoke feedback
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'feedbackIndex', type: 'uint64' },
    ],
    name: 'revokeFeedback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Read feedback
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddress', type: 'address' },
      { name: 'feedbackIndex', type: 'uint64' },
    ],
    name: 'readFeedback',
    outputs: [
      { name: 'score', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
      { name: 'isRevoked', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Get summary
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
    ],
    name: 'getSummary',
    outputs: [
      { name: 'count', type: 'uint256' },
      { name: 'averageScore', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // NewFeedback event (Jan 2026 update: tag1/tag2 now string, added feedbackIndex)
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'clientAddress', type: 'address' },
      { indexed: false, name: 'feedbackIndex', type: 'uint64' },
      { indexed: false, name: 'score', type: 'uint8' },
      { indexed: true, name: 'tag1', type: 'string' },
      { indexed: false, name: 'tag2', type: 'string' },
      { indexed: false, name: 'endpoint', type: 'string' },
      { indexed: false, name: 'feedbackURI', type: 'string' },
      { indexed: false, name: 'feedbackHash', type: 'bytes32' },
    ],
    name: 'NewFeedback',
    type: 'event',
  },
  // FeedbackRevoked event
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'clientAddress', type: 'address' },
      { indexed: false, name: 'feedbackIndex', type: 'uint64' },
    ],
    name: 'FeedbackRevoked',
    type: 'event',
  },
] as const satisfies Abi

// Reputation Registry contract addresses per chain
// Updated: Jan 2026 Mainnet deployment
export const REPUTATION_CONTRACTS: Record<number, Address> = {
  1: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63', // Ethereum Mainnet (Jan 2026)
  11155111: '0x8004B663056A597Dffe9eCcC1965A193B7388713', // Sepolia (for reference)
}

// Get reputation contract address for a chain
export function getReputationContract(chainId: number): Address | undefined {
  return REPUTATION_CONTRACTS[chainId]
}
