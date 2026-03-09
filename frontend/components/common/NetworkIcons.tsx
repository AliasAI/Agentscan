'use client'

import {
  NetworkAbstract,
  NetworkEthereum,
  NetworkPolygon,
  NetworkBinanceSmartChain,
  NetworkBase,
  NetworkMonad,
  NetworkLinea,
  NetworkArbitrumOne,
  NetworkOptimism,
  NetworkScroll,
  NetworkAvalanche,
  NetworkCelo,
  NetworkGnosis,
  NetworkTaiko,
  NetworkMegaEth,
  NetworkMantle,
  NetworkMetisAndromeda,
  NetworkSoneium,
  NetworkXLayer,
} from '@web3icons/react'
import type { IconComponent } from '@web3icons/react'
import { getNetworkIconType } from '@/lib/networks'

interface IconProps {
  className?: string
  size?: number
}

// Fallback icon for unsupported networks
export function DefaultNetworkIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path d="M2 12H22" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2C14.5 4.7 16 8.3 16 12C16 15.7 14.5 19.3 12 22C9.5 19.3 8 15.7 8 12C8 8.3 9.5 4.7 12 2Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  )
}

// Map our network icon types to web3icons components
const ICON_COMPONENTS: Record<string, IconComponent> = {
  abstract: NetworkAbstract,
  ethereum: NetworkEthereum,
  polygon: NetworkPolygon,
  bsc: NetworkBinanceSmartChain,
  base: NetworkBase,
  monad: NetworkMonad,
  linea: NetworkLinea,
  arbitrum: NetworkArbitrumOne,
  optimism: NetworkOptimism,
  scroll: NetworkScroll,
  avalanche: NetworkAvalanche,
  celo: NetworkCelo,
  gnosis: NetworkGnosis,
  taiko: NetworkTaiko,
  megaeth: NetworkMegaEth,
  mantle: NetworkMantle,
  metis: NetworkMetisAndromeda,
  soneium: NetworkSoneium,
  xlayer: NetworkXLayer,
}

interface NetworkIconProps {
  networkName: string
  className?: string
}

/**
 * Renders the appropriate icon for a network using web3icons library
 * Falls back to DefaultNetworkIcon if network is not supported
 */
export function NetworkIcon({
  networkName,
  className = 'w-5 h-5',
}: NetworkIconProps) {
  const iconType = getNetworkIconType(networkName)
  const IconComponent = ICON_COMPONENTS[iconType]

  if (!IconComponent) {
    return <DefaultNetworkIcon className={className} />
  }

  // Extract size from className (e.g., "w-5 h-5" -> 20, "w-6 h-6" -> 24)
  const sizeMatch = className.match(/w-(\d+)/)
  const size = sizeMatch ? parseInt(sizeMatch[1]) * 4 : 20

  return <IconComponent size={size} variant="branded" className={className} />
}

// Legacy exports for backwards compatibility
export const SepoliaIcon = (props: IconProps) => (
  <NetworkEthereum size={props.size || 20} variant="branded" />
)
export const EthereumIcon = (props: IconProps) => (
  <NetworkEthereum size={props.size || 20} variant="branded" />
)
export const EthereumMainnetIcon = EthereumIcon
export const PolygonIcon = (props: IconProps) => (
  <NetworkPolygon size={props.size || 20} variant="branded" />
)
export const BSCIcon = (props: IconProps) => (
  <NetworkBinanceSmartChain size={props.size || 20} variant="branded" />
)
export const BaseIcon = (props: IconProps) => (
  <NetworkBase size={props.size || 20} variant="branded" />
)
export const MonadIcon = (props: IconProps) => (
  <NetworkMonad size={props.size || 20} variant="branded" />
)
export const LineaIcon = (props: IconProps) => (
  <NetworkLinea size={props.size || 20} variant="branded" />
)
