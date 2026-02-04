'use client'

import { getNetworkIconType } from '@/lib/networks'

interface IconProps {
  className?: string
}

export function EthereumIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 784 784"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="392" cy="392" r="392" fill="#627EEA" />
      <path
        d="M392.07 92.5V315.35L580.15 392.01L392.07 92.5Z"
        fill="white"
        fillOpacity="0.602"
      />
      <path d="M392.07 92.5L204 392.01L392.07 315.35V92.5Z" fill="white" />
      <path
        d="M392.07 536.09V691.16L580.28 432.34L392.07 536.09Z"
        fill="white"
        fillOpacity="0.602"
      />
      <path d="M392.07 691.16V535.95L204 432.34L392.07 691.16Z" fill="white" />
      <path
        d="M392.07 495.69L580.15 392.01L392.07 315.47V495.69Z"
        fill="white"
        fillOpacity="0.2"
      />
      <path
        d="M204 392.01L392.07 495.69V315.47L204 392.01Z"
        fill="white"
        fillOpacity="0.602"
      />
    </svg>
  )
}

export function PolygonIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 178 178"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="89" cy="89" r="89" fill="#8247E5" />
      <path
        d="M118.4 70.5C116.2 69.2 113.4 69.2 111 70.5L94.5 80.2L83.4 86.4L67 96.1C64.8 97.4 62 97.4 59.6 96.1L46.8 88.5C44.6 87.2 43.1 84.8 43.1 82.2V67.3C43.1 64.7 44.5 62.3 46.8 61L59.5 53.6C61.7 52.3 64.5 52.3 66.9 53.6L79.6 61C81.8 62.3 83.3 64.7 83.3 67.3V77L94.4 70.6V61C94.4 58.4 93 56 90.7 54.7L67.1 41.1C64.9 39.8 62.1 39.8 59.7 41.1L35.6 54.9C33.3 56.2 31.9 58.6 31.9 61.2V88.4C31.9 91 33.3 93.4 35.6 94.7L59.5 108.3C61.7 109.6 64.5 109.6 66.9 108.3L83.4 98.8L94.5 92.4L111 82.9C113.2 81.6 116 81.6 118.4 82.9L131.1 90.3C133.3 91.6 134.8 94 134.8 96.6V111.5C134.8 114.1 133.4 116.5 131.1 117.8L118.5 125.4C116.3 126.7 113.5 126.7 111.1 125.4L98.4 118C96.2 116.7 94.7 114.3 94.7 111.7V102L83.6 108.4V117.9C83.6 120.5 85 122.9 87.3 124.2L111.2 137.8C113.4 139.1 116.2 139.1 118.6 137.8L142.5 124.2C144.7 122.9 146.2 120.5 146.2 117.9V90.5C146.2 87.9 144.8 85.5 142.5 84.2L118.4 70.5Z"
        fill="white"
      />
    </svg>
  )
}

export function BSCIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 126 126"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="63" cy="63" r="63" fill="#F0B90B" />
      <path
        d="M63 28L78.5 43.5L68.8 53.2L63 47.4L57.2 53.2L47.5 43.5L63 28Z"
        fill="white"
      />
      <path
        d="M88.5 53.5L98.2 63.2L88.5 72.9L78.8 63.2L88.5 53.5Z"
        fill="white"
      />
      <path
        d="M63 79L78.5 63.5L88.2 73.2L63 98.4L37.8 73.2L47.5 63.5L63 79Z"
        fill="white"
      />
      <path
        d="M37.5 53.5L47.2 63.2L37.5 72.9L27.8 63.2L37.5 53.5Z"
        fill="white"
      />
      <path
        d="M63 53.5L72.7 63.2L63 72.9L53.3 63.2L63 53.5Z"
        fill="white"
      />
    </svg>
  )
}

export function BaseIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 111 111"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF" />
      <path
        d="M55.4 93.5C76.3 93.5 93.2 76.5 93.2 55.5C93.2 34.5 76.3 17.5 55.4 17.5C35.6 17.5 19.3 32.7 17.7 52H69.8V59H17.7C19.3 78.3 35.6 93.5 55.4 93.5Z"
        fill="white"
      />
    </svg>
  )
}

export function LineaIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="50" fill="#121212" />
      <path d="M30 70V30H38V62H62V70H30Z" fill="white" />
      <circle cx="70" cy="30" r="8" fill="white" />
    </svg>
  )
}

export function HederaIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="50" fill="#000000" />
      <path
        d="M70.5 71H63.8V55.8H36.2V71H29.5V29H36.2V44.2H63.8V29H70.5V71Z"
        fill="white"
      />
      <path d="M36.2 48V51.8H63.8V48H36.2Z" fill="white" />
    </svg>
  )
}

export function MonadIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="50" fill="#F5F5F5" />
      <path
        d="M50 20L75 35V65L50 80L25 65V35L50 20Z"
        fill="none"
        stroke="#836EF9"
        strokeWidth="4"
      />
      <path
        d="M50 20L75 35L50 50L25 35L50 20Z"
        fill="#836EF9"
        fillOpacity="0.3"
      />
      <path
        d="M50 50V80L25 65V35L50 50Z"
        fill="#836EF9"
        fillOpacity="0.5"
      />
      <path
        d="M50 50V80L75 65V35L50 50Z"
        fill="#836EF9"
        fillOpacity="0.7"
      />
    </svg>
  )
}

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

// Icon type to component mapping
const ICON_COMPONENTS: Record<string, React.FC<IconProps>> = {
  ethereum: EthereumIcon,
  polygon: PolygonIcon,
  bsc: BSCIcon,
  base: BaseIcon,
  linea: LineaIcon,
  hedera: HederaIcon,
  monad: MonadIcon,
  default: DefaultNetworkIcon,
}

interface NetworkIconProps {
  networkName: string
  className?: string
}

/**
 * Renders the appropriate icon for a network based on its name
 * Uses the unified network config from lib/networks.ts
 */
export function NetworkIcon({
  networkName,
  className = 'w-5 h-5',
}: NetworkIconProps) {
  const iconType = getNetworkIconType(networkName)
  const IconComponent = ICON_COMPONENTS[iconType] || DefaultNetworkIcon
  return <IconComponent className={className} />
}

// Legacy exports for backwards compatibility
export const SepoliaIcon = EthereumIcon
export const EthereumMainnetIcon = EthereumIcon
