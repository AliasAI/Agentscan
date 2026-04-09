import type { Metadata } from 'next'
import { fetchAgent } from '@/lib/api/server'
import { SITE_URL, SITE_NAME } from '@/lib/seo/constants'
import { BreadcrumbJsonLd, AgentJsonLd } from '@/components/seo/JsonLd'
import AgentDetailClient from './AgentDetailClient'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const agent = await fetchAgent(id)

  if (!agent) {
    return { title: 'Agent Not Found' }
  }

  const title = agent.name || `Agent ${id.slice(0, 8)}`
  const description = agent.description
    ? agent.description.slice(0, 155)
    : `View details, reputation, and on-chain data for ${agent.name} on ${agent.network_name || 'ERC-8004'}.`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'article',
      url: `${SITE_URL}/agents/${id}`,
    },
    twitter: {
      card: 'summary',
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/agents/${id}`,
    },
  }
}

export default async function AgentDetailPage({ params }: Props) {
  const { id } = await params
  const agent = await fetchAgent(id)

  return (
    <>
      {agent && <BreadcrumbJsonLd agentName={agent.name} agentId={id} />}
      {agent && <AgentJsonLd agent={agent} />}
      <AgentDetailClient />
    </>
  )
}
