/**
 * Custom chain definitions for networks not included in wagmi/viem
 *
 * Supported networks:
 * - Sepolia (built-in)
 * - Base Sepolia (built-in)
 * - BSC Testnet (built-in)
 * - Linea Sepolia (custom)
 * - Hedera Testnet (custom)
 */

import { defineChain } from 'viem'

// Linea Sepolia Testnet
export const lineaSepolia = defineChain({
  id: 59141,
  name: 'Linea Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.linea.build'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Lineascan',
      url: 'https://sepolia.lineascan.build',
    },
  },
  testnet: true,
})

// Hedera Testnet
export const hederaTestnet = defineChain({
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    name: 'HBAR',
    symbol: 'HBAR',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HashScan',
      url: 'https://hashscan.io/testnet',
    },
  },
  testnet: true,
})

// All supported chains for the application
export const supportedChains = {
  sepolia: 11155111,
  baseSepolia: 84532,
  bscTestnet: 97,
  lineaSepolia: 59141,
  hederaTestnet: 296,
} as const

export type SupportedChainId = (typeof supportedChains)[keyof typeof supportedChains]
