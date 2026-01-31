/**
 * Chain definitions for ERC-8004 Agent creation
 *
 * Mainnet only configuration (Jan 2026 mainnet launch)
 */

// All supported chains for the application - Mainnet only
export const supportedChains = {
  mainnet: 1,
} as const

export type SupportedChainId = (typeof supportedChains)[keyof typeof supportedChains]
