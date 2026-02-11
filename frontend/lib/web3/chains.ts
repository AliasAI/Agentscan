/**
 * Chain definitions for ERC-8004 Agent creation
 *
 * All 14 mainnet networks supported (CREATE2 deterministic deployment)
 */

// All supported mainnet chain IDs
export const SUPPORTED_CHAIN_IDS = [
  1,       // Ethereum
  137,     // Polygon
  8453,    // Base
  42161,   // Arbitrum
  10,      // Optimism
  59144,   // Linea
  534352,  // Scroll
  43114,   // Avalanche
  42220,   // Celo
  100,     // Gnosis
  167000,  // Taiko
  4326,    // MegaETH
  56,      // BSC
  143,     // Monad
] as const

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number]
