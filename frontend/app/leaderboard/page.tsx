import type { Metadata } from 'next'
import LeaderboardPage from './LeaderboardClient'

export const metadata: Metadata = {
  title: 'Agent Leaderboard',
  description:
    'Top-ranked ERC-8004 AI agents by composite score. ' +
    'Ranked by service availability, usage, quality, and profile completeness.',
}

export default function Page() {
  return <LeaderboardPage />
}
