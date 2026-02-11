/**
 * Wagmi configuration for ERC-8004 Agent creation
 *
 * Supports all 14 mainnet networks with CREATE2 contracts
 */

import { http, createConfig, createStorage } from 'wagmi'
import {
  mainnet, polygon, base, arbitrum, optimism,
  linea, scroll, avalanche, celo, gnosis,
  taiko, bsc, monad,
} from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'

// MegaETH mainnet is not yet in wagmi/chains - define custom
const megaeth = defineChain({
  id: 4326,
  name: 'MegaETH',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.megaeth.com'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://megaeth.blockscout.com' },
  },
})

// All supported chains
export const chains = [
  mainnet, polygon, base, arbitrum, optimism,
  linea, scroll, avalanche, celo, gnosis,
  taiko, megaeth, bsc, monad,
] as const

// Create wagmi config
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected({ shimDisconnect: true }),
  ],
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    key: 'agentscan-wallet',
  }),
  transports: Object.fromEntries(
    chains.map((chain) => [chain.id, http()])
  ) as Record<(typeof chains)[number]['id'], ReturnType<typeof http>>,
  ssr: true,
})

// Chain ID to display name mapping
export const chainNames: Record<number, string> = Object.fromEntries(
  chains.map((chain) => [chain.id, chain.name])
)

// Check if a chain is supported
export function isSupportedChain(chainId: number | undefined): boolean {
  if (!chainId) return false
  return chains.some((chain) => chain.id === chainId)
}
