import type { Metadata } from 'next'
import InsightsPage from './InsightsClient'

export const metadata: Metadata = {
  title: 'Protocol Insights',
  description:
    'Analytics and trends for the ERC-8004 AI agent protocol. ' +
    'Track registration activity, transaction stats, and network distribution.',
}

export default function Page() {
  return <InsightsPage />
}
