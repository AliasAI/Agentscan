import type { Metadata } from 'next'
import CreateAgentPage from './CreateClient'

export const metadata: Metadata = {
  title: 'Register an Agent',
  description:
    'Register your AI agent on-chain using the ERC-8004 protocol. ' +
    'Connect your wallet, set OASF metadata, and deploy to any supported network.',
}

export default function Page() {
  return <CreateAgentPage />
}
