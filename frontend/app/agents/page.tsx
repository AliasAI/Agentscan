import type { Metadata } from 'next'
import AgentsPage from './AgentsPageClient'

export const metadata: Metadata = {
  title: 'Browse AI Agents',
  description:
    'Search and filter ERC-8004 AI agents across 21+ blockchain networks. ' +
    'View reputation scores, OASF taxonomy classifications, and on-chain activity.',
}

export default function Page() {
  return <AgentsPage />
}
