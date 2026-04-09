import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/constants'
import { fetchAgentPage } from '@/lib/api/server'

const staticRoutes: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: 'daily', priority: 1.0 },
  { url: `${SITE_URL}/agents`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/leaderboard`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${SITE_URL}/networks`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/insights`, changeFrequency: 'daily', priority: 0.7 },
  { url: `${SITE_URL}/create`, changeFrequency: 'monthly', priority: 0.6 },
  // Docs
  { url: `${SITE_URL}/docs`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/docs/getting-started`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/docs/erc-8004`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/docs/mcp`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/docs/mcp/tools`, changeFrequency: 'weekly', priority: 0.6 },
  { url: `${SITE_URL}/docs/api/agents`, changeFrequency: 'weekly', priority: 0.6 },
  { url: `${SITE_URL}/docs/api/feedback`, changeFrequency: 'weekly', priority: 0.6 },
  { url: `${SITE_URL}/docs/api/analytics`, changeFrequency: 'weekly', priority: 0.5 },
  { url: `${SITE_URL}/docs/api/networks`, changeFrequency: 'weekly', priority: 0.5 },
  { url: `${SITE_URL}/docs/api/taxonomy`, changeFrequency: 'weekly', priority: 0.5 },
  { url: `${SITE_URL}/docs/api/endpoint-health`, changeFrequency: 'weekly', priority: 0.5 },
  { url: `${SITE_URL}/docs/api/leaderboard`, changeFrequency: 'weekly', priority: 0.5 },
]

const AGENTS_PER_PAGE = 100
const MAX_AGENT_PAGES = 100 // Cap at 10,000 agents in sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [...staticRoutes]

  // Fetch agent pages for dynamic routes
  const { total } = await fetchAgentPage(1, 1)
  const totalPages = Math.min(
    Math.ceil(total / AGENTS_PER_PAGE),
    MAX_AGENT_PAGES
  )

  for (let page = 1; page <= totalPages; page++) {
    const { items } = await fetchAgentPage(page, AGENTS_PER_PAGE)
    for (const agent of items) {
      entries.push({
        url: `${SITE_URL}/agents/${agent.id}`,
        lastModified: agent.updated_at ? new Date(agent.updated_at) : undefined,
        changeFrequency: 'daily',
        priority: 0.6,
      })
    }
  }

  return entries
}
