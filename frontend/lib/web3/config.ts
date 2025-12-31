/**
 * Wagmi configuration for ERC-8004 Agent creation
 *
 * Supports 5 networks:
 * - Sepolia, Base Sepolia, BSC Testnet (built-in)
 * - Linea Sepolia, Hedera Testnet (custom defined)
 */

import { http, createConfig, createStorage } from 'wagmi'
import { sepolia, baseSepolia, bscTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { lineaSepolia, hederaTestnet } from './chains'

// All supported chains
export const chains = [
  sepolia,
  baseSepolia,
  bscTestnet,
  lineaSepolia,
  hederaTestnet,
] as const

// Create wagmi config
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    key: 'agentscan-wallet',
  }),
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [bscTestnet.id]: http(),
    [lineaSepolia.id]: http(),
    [hederaTestnet.id]: http(),
  },
  ssr: true,
})

// Chain ID to name mapping for display
export const chainNames: Record<number, string> = {
  [sepolia.id]: 'Sepolia',
  [baseSepolia.id]: 'Base Sepolia',
  [bscTestnet.id]: 'BSC Testnet',
  [lineaSepolia.id]: 'Linea Sepolia',
  [hederaTestnet.id]: 'Hedera Testnet',
}

// Check if a chain is supported
export function isSupportedChain(chainId: number | undefined): boolean {
  if (!chainId) return false
  return chains.some((chain) => chain.id === chainId)
}
