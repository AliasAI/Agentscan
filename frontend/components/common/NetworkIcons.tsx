'use client'

interface IconProps {
  className?: string
}

export function SepoliaIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 784 784" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="392" cy="392" r="392" fill="#627EEA"/>
      <path d="M392.07 92.5V315.35L580.15 392.01L392.07 92.5Z" fill="white" fillOpacity="0.602"/>
      <path d="M392.07 92.5L204 392.01L392.07 315.35V92.5Z" fill="white"/>
      <path d="M392.07 536.09V691.16L580.28 432.34L392.07 536.09Z" fill="white" fillOpacity="0.602"/>
      <path d="M392.07 691.16V535.95L204 432.34L392.07 691.16Z" fill="white"/>
      <path d="M392.07 495.69L580.15 392.01L392.07 315.47V495.69Z" fill="white" fillOpacity="0.2"/>
      <path d="M204 392.01L392.07 495.69V315.47L204 392.01Z" fill="white" fillOpacity="0.602"/>
    </svg>
  )
}

export function BaseIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
      <path d="M55.4 93.5C76.3 93.5 93.2 76.5 93.2 55.5C93.2 34.5 76.3 17.5 55.4 17.5C35.6 17.5 19.3 32.7 17.7 52H69.8V59H17.7C19.3 78.3 35.6 93.5 55.4 93.5Z" fill="white"/>
    </svg>
  )
}

export function LineaIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#121212"/>
      <path d="M30 70V30H38V62H62V70H30Z" fill="white"/>
      <circle cx="70" cy="30" r="8" fill="white"/>
    </svg>
  )
}

export function HederaIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#000000"/>
      <path d="M70.5 71H63.8V55.8H36.2V71H29.5V29H36.2V44.2H63.8V29H70.5V71Z" fill="white"/>
      <path d="M36.2 48V51.8H63.8V48H36.2Z" fill="white"/>
    </svg>
  )
}

export function DefaultNetworkIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M2 12H22" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 2C14.5 4.7 16 8.3 16 12C16 15.7 14.5 19.3 12 22C9.5 19.3 8 15.7 8 12C8 8.3 9.5 4.7 12 2Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

interface NetworkIconProps {
  networkName: string
  className?: string
}

export function NetworkIcon({ networkName, className = 'w-5 h-5' }: NetworkIconProps) {
  switch (networkName) {
    case 'Sepolia':
      return <SepoliaIcon className={className} />
    case 'Base Sepolia':
      return <BaseIcon className={className} />
    case 'Linea Sepolia':
      return <LineaIcon className={className} />
    case 'Hedera Testnet':
      return <HederaIcon className={className} />
    default:
      return <DefaultNetworkIcon className={className} />
  }
}
