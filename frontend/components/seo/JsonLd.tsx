import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION } from '@/lib/seo/constants'

export function WebAppJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    applicationCategory: 'BlockchainApplication',
    operatingSystem: 'Any',
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function BreadcrumbJsonLd({
  agentName,
  agentId,
}: {
  agentName: string
  agentId: string
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Agents',
        item: `${SITE_URL}/agents`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: agentName,
        item: `${SITE_URL}/agents/${agentId}`,
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function AgentJsonLd({
  agent,
}: {
  agent: { name: string; description?: string; network_name?: string }
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: agent.name,
    description: agent.description || `AI agent on ${agent.network_name || 'ERC-8004'}`,
    applicationCategory: 'AI Agent',
    operatingSystem: agent.network_name || 'Blockchain',
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
