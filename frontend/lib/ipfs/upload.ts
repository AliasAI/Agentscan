/**
 * IPFS upload utility using Pinata
 *
 * Uploads JSON metadata to IPFS and returns the IPFS URI
 */

interface AgentMetadata {
  name: string
  description: string
  endpoints: Array<{
    url: string
    skills: string[]
    domains: string[]
  }>
  version: string
  created_at: string
}

interface PinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

/**
 * Get Pinata authentication headers
 *
 * Supports two authentication methods:
 * 1. JWT (recommended): Set NEXT_PUBLIC_PINATA_JWT
 * 2. API Key + Secret: Set NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_API_KEY
 */
function getPinataHeaders(): Record<string, string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
  const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY

  // Prefer JWT if available
  if (jwt) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    }
  }

  // Fall back to API Key + Secret
  if (apiKey && secretKey) {
    return {
      'Content-Type': 'application/json',
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    }
  }

  throw new Error(
    'Pinata credentials not configured. Please set either:\n' +
      '- NEXT_PUBLIC_PINATA_JWT (recommended), or\n' +
      '- NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_API_KEY'
  )
}

/**
 * Upload metadata JSON to IPFS via Pinata
 *
 * @param metadata - Agent metadata object
 * @returns IPFS URI (ipfs://...)
 */
export async function uploadToIPFS(metadata: AgentMetadata): Promise<string> {
  const headers = getPinataHeaders()

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `agent-${metadata.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload to IPFS: ${error}`)
  }

  const data: PinataResponse = await response.json()
  return `ipfs://${data.IpfsHash}`
}

/**
 * Build metadata object from form data
 */
export function buildMetadata(
  name: string,
  description: string,
  endpoints: Array<{ url: string; skills: string[]; domains: string[] }>
): AgentMetadata {
  return {
    name,
    description,
    endpoints: endpoints.filter((e) => e.url.trim()).map((e) => ({
      url: e.url.trim(),
      skills: e.skills,
      domains: e.domains,
    })),
    version: '1.0.0',
    created_at: new Date().toISOString(),
  }
}

/**
 * Validate metadata before upload
 */
export function validateMetadata(metadata: AgentMetadata): string | null {
  if (!metadata.name || metadata.name.length < 2) {
    return 'Name must be at least 2 characters'
  }
  if (metadata.name.length > 100) {
    return 'Name must be less than 100 characters'
  }
  if (!metadata.description || metadata.description.length < 20) {
    return 'Description must be at least 20 characters'
  }
  if (metadata.endpoints.length === 0) {
    return 'At least one endpoint is required'
  }
  for (let i = 0; i < metadata.endpoints.length; i++) {
    const ep = metadata.endpoints[i]
    if (!ep.url) {
      return `Endpoint ${i + 1}: URL is required`
    }
    try {
      new URL(ep.url)
    } catch {
      return `Endpoint ${i + 1}: Invalid URL format`
    }
  }
  return null
}
