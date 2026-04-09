import type { Metadata } from 'next'
import NetworksPage from './NetworksClient'

export const metadata: Metadata = {
  title: 'Supported Networks',
  description:
    'Explore ERC-8004 AI agents across 21+ blockchain networks including ' +
    'Ethereum, Base, Arbitrum, Polygon, Optimism, BSC, and more.',
}

export default function Page() {
  return <NetworksPage />
}
