// Server-side API helpers with ISR caching
// Only import this file from server components, sitemap.ts, or generateMetadata

import type { Agent, PaginatedResponse } from '@/types'

const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

export async function fetchAgent(id: string): Promise<Agent | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/agents/${id}`, {
      next: { revalidate: 300 }, // 5-minute cache
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function fetchAgentPage(
  page: number = 1,
  pageSize: number = 100
): Promise<{ items: Agent[]; total: number }> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      quality: 'basic',
      sort_field: 'created_at',
      sort_order: 'desc',
    })
    const res = await fetch(`${API_BASE_URL}/agents?${params}`, {
      next: { revalidate: 3600 }, // 1-hour cache
    })
    if (!res.ok) return { items: [], total: 0 }
    const data: PaginatedResponse<Agent> = await res.json()
    return { items: data.items, total: data.total }
  } catch {
    return { items: [], total: 0 }
  }
}
