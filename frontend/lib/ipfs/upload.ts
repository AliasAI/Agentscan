/**
 * IPFS upload utility using Pinata
 *
 * Builds ERC-8004 Registration Best Practices compliant JSON
 * and uploads to IPFS via Pinata API.
 */

import type {
  CreateAgentForm,
  RegistrationMetadata,
  RegistrationService,
  ServiceInput,
} from '@/types'

interface PinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

function getPinataHeaders(): Record<string, string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
  const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY

  if (jwt) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` }
  }
  if (apiKey && secretKey) {
    return { 'Content-Type': 'application/json', pinata_api_key: apiKey, pinata_secret_api_key: secretKey }
  }
  throw new Error(
    'Pinata credentials not configured. Set NEXT_PUBLIC_PINATA_JWT or API key pair.'
  )
}

/**
 * Upload Registration JSON to IPFS via Pinata
 */
export async function uploadToIPFS(metadata: RegistrationMetadata): Promise<string> {
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

/** Convert a form ServiceInput to the Registration JSON output format */
function toRegistrationService(s: ServiceInput): RegistrationService | null {
  switch (s.name) {
    case 'MCP':
      if (!s.endpoint.trim()) return null
      return { name: 'MCP', endpoint: s.endpoint.trim(), version: s.version, capabilities: s.mcpTools.filter(Boolean) }
    case 'A2A':
      if (!s.endpoint.trim()) return null
      return { name: 'A2A', endpoint: s.endpoint.trim(), version: s.version }
    case 'OASF':
      if (s.skills.length === 0 && s.domains.length === 0) return null
      return { name: 'OASF', endpoint: s.endpoint || '', version: s.version, skills: s.skills, domains: s.domains }
    case 'ENS':
      if (!s.endpoint.trim()) return null
      return { name: 'ENS', endpoint: s.endpoint.trim(), version: s.version }
    case 'DID':
      if (!s.endpoint.trim()) return null
      return { name: 'DID', endpoint: s.endpoint.trim(), version: s.version }
    case 'agentWallet':
      if (!s.endpoint.trim()) return null
      return { name: 'agentWallet', endpoint: s.endpoint.trim() }
  }
}

/**
 * Build ERC-8004 Registration JSON from form data
 */
export function buildMetadata(form: CreateAgentForm): RegistrationMetadata {
  const services = form.services
    .map(toRegistrationService)
    .filter((s): s is RegistrationService => s !== null)

  const metadata: RegistrationMetadata = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: form.name,
    description: form.description,
  }

  if (form.image.trim()) metadata.image = form.image.trim()
  if (services.length > 0) metadata.services = services
  if (!form.active) metadata.active = false
  if (form.x402Support) metadata.x402Support = true

  return metadata
}

/**
 * Validate Registration metadata before upload
 */
export function validateMetadata(metadata: RegistrationMetadata): string | null {
  if (!metadata.name || metadata.name.length < 2) {
    return 'Name must be at least 2 characters'
  }
  if (metadata.name.length > 100) {
    return 'Name must be less than 100 characters'
  }
  if (!metadata.description || metadata.description.length < 20) {
    return 'Description must be at least 20 characters'
  }
  if (metadata.image) {
    try { new URL(metadata.image) } catch {
      return 'Image must be a valid URL (https:// or ipfs://)'
    }
  }
  if (metadata.services) {
    for (let i = 0; i < metadata.services.length; i++) {
      const svc = metadata.services[i]
      const label = `Service ${i + 1} (${svc.name})`
      switch (svc.name) {
        case 'MCP':
        case 'A2A':
          try { new URL(svc.endpoint) } catch { return `${label}: Invalid endpoint URL` }
          break
        case 'ENS':
          if (!svc.endpoint.endsWith('.eth')) return `${label}: Must be a .eth name`
          break
        case 'DID':
          if (!svc.endpoint.startsWith('did:')) return `${label}: Must start with did:`
          break
        case 'agentWallet':
          if (!svc.endpoint.startsWith('eip155:')) return `${label}: Must use eip155: format`
          break
        case 'OASF':
          if (svc.skills.length === 0 && svc.domains.length === 0) {
            return `${label}: Select at least 1 skill or domain`
          }
          break
      }
    }
  }
  return null
}

// =============================================================================
// Feedback Metadata (for Write Review feature)
// =============================================================================

export interface FeedbackMetadata {
  agentId: number
  score: number          // 0-100
  tag1: string
  tag2: string
  endpoint: string
  review?: string        // Optional review text
  clientAddress: string
  timestamp: string
}

/**
 * Upload feedback metadata to IPFS via Pinata
 *
 * @param metadata - Feedback metadata object
 * @returns Object containing IPFS URI and content hash
 */
export async function uploadFeedbackToIPFS(
  metadata: FeedbackMetadata
): Promise<{ uri: string; hash: `0x${string}` }> {
  const headers = getPinataHeaders()

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `feedback-agent${metadata.agentId}-${Date.now()}`,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload feedback to IPFS: ${error}`)
  }

  const data: PinataResponse = await response.json()
  const uri = `ipfs://${data.IpfsHash}`

  // Calculate keccak256 hash of the content for on-chain verification
  const contentString = JSON.stringify(metadata)
  const hash = await hashContent(contentString)

  return { uri, hash }
}

/**
 * Calculate keccak256 hash of content string
 * Uses Web Crypto API with fallback
 */
async function hashContent(content: string): Promise<`0x${string}`> {
  // Use viem's keccak256 if available (it handles string encoding properly)
  try {
    const { keccak256, toBytes } = await import('viem')
    const hash = keccak256(toBytes(content))
    return hash
  } catch {
    // Fallback: use a simple hash (not cryptographically secure, but works)
    // In production, viem should always be available
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    return `0x${hashHex}` as `0x${string}`
  }
}

/**
 * Build feedback metadata object from form data
 */
export function buildFeedbackMetadata(
  agentId: number,
  score: number,
  tag1: string,
  tag2: string,
  endpoint: string,
  clientAddress: string,
  review?: string
): FeedbackMetadata {
  return {
    agentId,
    score,
    tag1,
    tag2,
    endpoint,
    review: review?.trim() || undefined,
    clientAddress,
    timestamp: new Date().toISOString(),
  }
}
