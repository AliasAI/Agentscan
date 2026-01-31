'use client'

import { useState, type ReactNode } from 'react'
import { useToast } from '@/components/common/Toast'

interface MetadataViewerProps {
  metadata: Record<string, unknown> | null
  loading: boolean
  error?: string
  uriType?: string
  resolvedUrl?: string
  fetchTimeMs?: number
}

// OASF standard fields to highlight
const OASF_FIELDS = ['name', 'description', 'services', 'endpoints', 'version', 'skills', 'domains']

export function MetadataViewer({
  metadata,
  loading,
  error,
  uriType,
  resolvedUrl,
  fetchTimeMs,
}: MetadataViewerProps) {
  const [showRaw, setShowRaw] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'endpoints'])
  )
  const toast = useToast()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a0a0a] dark:border-[#fafafa] border-t-transparent" />
        <span className="ml-3 text-[#737373]">Fetching metadata...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-red-600 dark:text-red-400">
        <p className="font-medium">Failed to fetch metadata</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (!metadata) {
    return <div className="text-center py-8 text-[#737373]">No metadata available</div>
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  // Separate services/endpoints from basic fields (ERC-8004 Jan 2026: endpoints → services)
  const { services, endpoints, ...basicFields } = metadata as Record<string, unknown> & {
    services?: Array<Record<string, unknown>>
    endpoints?: Array<Record<string, unknown>>
  }
  // Prefer services (new format), fall back to endpoints (old format)
  const servicesList = services || endpoints

  return (
    <div className="space-y-4">
      {/* Meta info bar */}
      {(uriType || fetchTimeMs) && (
        <div className="flex items-center gap-4 text-xs text-[#737373]">
          {uriType && (
            <span className="px-2 py-1 bg-[#f5f5f5] dark:bg-[#262626] rounded font-medium">
              {uriType.toUpperCase()}
            </span>
          )}
          {fetchTimeMs !== undefined && <span>Fetched in {fetchTimeMs}ms</span>}
          {resolvedUrl && (
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px]"
            >
              {resolvedUrl}
            </a>
          )}
        </div>
      )}

      {/* Basic Info section */}
      <CollapsibleSection
        title="Basic Info"
        isExpanded={expandedSections.has('basic')}
        onToggle={() => toggleSection('basic')}
      >
        <div className="space-y-2">
          {Object.entries(basicFields).map(([key, value]) => (
            <FieldRow key={key} fieldKey={key} value={value} isOASF={OASF_FIELDS.includes(key)} />
          ))}
        </div>
      </CollapsibleSection>

      {/* Services section (ERC-8004 Jan 2026: renamed from Endpoints) */}
      {servicesList && Array.isArray(servicesList) && servicesList.length > 0 && (
        <CollapsibleSection
          title={`Services (${servicesList.length})`}
          isExpanded={expandedSections.has('endpoints')}
          onToggle={() => toggleSection('endpoints')}
        >
          <div className="space-y-3">
            {servicesList.map((service, idx) => (
              <EndpointCard key={idx} endpoint={service} index={idx} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Raw JSON section */}
      <CollapsibleSection
        title="Raw JSON"
        isExpanded={showRaw}
        onToggle={() => setShowRaw(!showRaw)}
        action={
          <button
            onClick={(e) => {
              e.stopPropagation()
              copyToClipboard(JSON.stringify(metadata, null, 2))
            }}
            className="px-2 py-1 text-xs bg-[#e5e5e5] dark:bg-[#333] hover:bg-[#d4d4d4] dark:hover:bg-[#404040] rounded transition-colors"
          >
            Copy
          </button>
        }
      >
        <pre className="bg-[#fafafa] dark:bg-[#0a0a0a] p-4 rounded-lg text-xs overflow-x-auto text-[#525252] dark:text-[#a3a3a3] font-mono leading-relaxed max-h-[300px]">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </CollapsibleSection>
    </div>
  )
}

// Collapsible section component
function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  action,
  children,
}: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="border border-[#e5e5e5] dark:border-[#262626] rounded-lg overflow-hidden">
      <div
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#fafafa] dark:bg-[#0a0a0a] hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className={`text-[#737373] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          >
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa]">{title}</span>
        </div>
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
      </div>
      {isExpanded && <div className="px-4 py-3 bg-white dark:bg-[#171717]">{children}</div>}
    </div>
  )
}

// Field row component
function FieldRow({
  fieldKey,
  value,
  isOASF,
}: {
  fieldKey: string
  value: unknown
  isOASF: boolean
}) {
  const displayValue =
    typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '')

  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-[#f5f5f5] dark:border-[#1f1f1f] last:border-0">
      <span
        className={`text-xs font-mono flex-shrink-0 min-w-[100px] ${
          isOASF ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-[#737373]'
        }`}
      >
        {fieldKey}
      </span>
      <span className="text-sm text-[#0a0a0a] dark:text-[#fafafa] break-all">{displayValue}</span>
    </div>
  )
}

// Service card component (formerly EndpointCard)
function EndpointCard({ endpoint }: { endpoint: Record<string, unknown>; index: number }) {
  const name = endpoint.name as string | undefined
  const url = (endpoint.url || endpoint.endpoint) as string | undefined
  const version = endpoint.version as string | undefined
  const skills = endpoint.skills as string[] | undefined
  const domains = endpoint.domains as string[] | undefined
  // A2A specific fields
  const a2aSkills = endpoint.a2aSkills as string[] | undefined

  // Fields to exclude from "other fields" display
  const excludedFields = ['name', 'url', 'endpoint', 'version', 'skills', 'domains', 'a2aSkills']

  // Get service type icon
  const getServiceIcon = (serviceName?: string) => {
    const n = (serviceName || '').toLowerCase()
    if (n.includes('a2a')) return '🤖'
    if (n.includes('oasf')) return '📋'
    if (n.includes('mcp')) return '🔌'
    if (n.includes('web')) return '🌐'
    if (n.includes('twitter') || n.includes('x.com')) return '𝕏'
    if (n.includes('email')) return '📧'
    if (n.includes('api')) return '⚡'
    return '🔗'
  }

  return (
    <div className="bg-[#f5f5f5] dark:bg-[#0a0a0a] rounded-lg p-4">
      {/* Header: Name + Version */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{getServiceIcon(name)}</span>
          <span className="font-medium text-[#0a0a0a] dark:text-[#fafafa]">
            {name || 'Service'}
          </span>
          {version && (
            <span className="px-1.5 py-0.5 text-[10px] bg-[#e5e5e5] dark:bg-[#333] text-[#737373] rounded">
              v{version.replace(/^v/, '')}
            </span>
          )}
        </div>
      </div>

      {/* URL/Endpoint */}
      {url && (
        <div className="mb-3">
          <a
            href={url.includes('@') ? `mailto:${url}` : url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {url}
          </a>
        </div>
      )}

      {/* Skills tags (OASF standard) */}
      {skills && skills.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-[#737373] font-medium">Skills</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md"
              >
                {skill.split('/').pop()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* A2A Skills (if present) */}
      {a2aSkills && a2aSkills.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-[#737373] font-medium">A2A Skills</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {a2aSkills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md"
              >
                {skill.split('/').pop()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Domains tags */}
      {domains && domains.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-[#737373] font-medium">Domains</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {domains.map((domain) => (
              <span
                key={domain}
                className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md"
              >
                {domain.split('/').pop()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Other fields (compact display) */}
      {Object.entries(endpoint)
        .filter(([key]) => !excludedFields.includes(key))
        .length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#e5e5e5] dark:border-[#262626]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(endpoint)
              .filter(([key]) => !excludedFields.includes(key))
              .map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="text-[#737373]">{key}: </span>
                  <span className="text-[#525252] dark:text-[#a3a3a3]">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
