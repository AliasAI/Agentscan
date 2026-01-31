/**
 * Wagmi configuration for ERC-8004 Agent creation
 *
 * Mainnet only configuration (Jan 2026 mainnet launch)
 */

import { http, createConfig, createStorage } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// All supported chains - Mainnet only
export const chains = [mainnet] as const

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
    [mainnet.id]: http(),
  },
  ssr: true,
})

// Chain ID to name mapping for display
export const chainNames: Record<number, string> = {
  [mainnet.id]: 'Ethereum Mainnet',
}

// Check if a chain is supported
export function isSupportedChain(chainId: number | undefined): boolean {
  if (!chainId) return false
  return chains.some((chain) => chain.id === chainId)
}
