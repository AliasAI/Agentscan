'use client'

/**
 * MetadataPreview - Real-time JSON preview of agent metadata
 *
 * Shows the OASF-compliant metadata that will be uploaded to IPFS
 */

import { useMemo, useState } from 'react'
import type { EndpointInput } from './EndpointEditor'

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

interface MetadataPreviewProps {
  name: string
  description: string
  endpoints: EndpointInput[]
}

export function MetadataPreview({ name, description, endpoints }: MetadataPreviewProps) {
  const [copied, setCopied] = useState(false)

  const metadata: AgentMetadata = useMemo(
    () => ({
      name: name || 'Agent Name',
      description: description || 'Agent description...',
      endpoints: endpoints
        .filter((e) => e.url.trim())
        .map((e) => ({
          url: e.url,
          skills: e.skills,
          domains: e.domains,
        })),
      version: '1.0.0',
      created_at: new Date().toISOString(),
    }),
    [name, description, endpoints]
  )

  const jsonString = useMemo(() => JSON.stringify(metadata, null, 2), [metadata])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  return (
    <div className="border border-[#e5e5e5] dark:border-[#333] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#f5f5f5] dark:bg-[#1a1a1a] border-b border-[#e5e5e5] dark:border-[#333]">
        <span className="text-xs font-medium text-[#6e6e73] dark:text-[#86868b]">
          Metadata Preview
        </span>
        <button
          type="button"
          onClick={copyToClipboard}
          className="text-xs text-[#6e6e73] dark:text-[#86868b] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* JSON content */}
      <pre className="p-4 text-xs font-mono overflow-x-auto bg-white dark:bg-[#0a0a0a] text-[#0a0a0a] dark:text-[#fafafa] max-h-64">
        <code>{jsonString}</code>
      </pre>
    </div>
  )
}
