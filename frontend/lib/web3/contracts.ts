/**
 * ERC-8004 Identity Registry contract configuration
 *
 * Contract addresses match backend/src/core/networks_config.py
 */

import type { Address, Abi } from 'viem'

// Identity Registry ABI - includes register method for agent creation
export const IDENTITY_REGISTRY_ABI = [
  // Register new agent - returns token ID
  {
    inputs: [{ name: 'tokenURI_', type: 'string' }],
    name: 'register',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Update metadata URI
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newUri', type: 'string' },
    ],
    name: 'setTokenURI',
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
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: false, name: 'tokenURI', type: 'string' },
      { indexed: true, name: 'owner', type: 'address' },
    ],
    name: 'Registered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: false, name: 'newUri', type: 'string' },
      { indexed: true, name: 'updatedBy', type: 'address' },
    ],
    name: 'UriUpdated',
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
] as const satisfies Abi

// Contract addresses per chain - matches backend networks_config.py
export const IDENTITY_CONTRACTS: Record<number, Address> = {
  11155111: '0x8004a6090Cd10A7288092483047B097295Fb8847', // Sepolia
  84532: '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb', // Base Sepolia
  97: '0x4f8c8694eAB93bbF7616EDD522503544E61E7dB7', // BSC Testnet
  59141: '0x8004aa7C931bCE1233973a0C6A667f73F66282e7', // Linea Sepolia
  296: '0x0dDaa2de07deb24D5F0288ee29c3c57c4159DcC7', // Hedera Testnet
}

// Get contract address for a chain
export function getIdentityContract(chainId: number): Address | undefined {
  return IDENTITY_CONTRACTS[chainId]
}

// Block explorer URLs for transaction links
export const BLOCK_EXPLORERS: Record<number, string> = {
  11155111: 'https://sepolia.etherscan.io',
  84532: 'https://sepolia.basescan.org',
  97: 'https://testnet.bscscan.com',
  59141: 'https://sepolia.lineascan.build',
  296: 'https://hashscan.io/testnet',
}

// Get transaction URL
export function getTransactionUrl(chainId: number, txHash: string): string {
  const explorer = BLOCK_EXPLORERS[chainId] || 'https://etherscan.io'
  return `${explorer}/tx/${txHash}`
}
