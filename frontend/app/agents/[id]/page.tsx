'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/common/Card'
import { DetailPageSkeleton } from '@/components/common/Skeleton'
import { useToast } from '@/components/common/Toast'
import { agentService } from '@/lib/api/services'
import { formatAddress, formatDate } from '@/lib/utils/format'
import { getNftExplorerUrl } from '@/lib/utils/network'
import { NetworkIcon } from '@/components/common/NetworkIcons'
import { OASFDetailTags } from '@/components/agent/OASFTags'
import type { Agent } from '@/types'

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  const toast = useToast()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch agent details
        const agentData = await agentService.getAgentById(agentId)
        setAgent(agentData)
      } catch (err) {
        console.error('Failed to fetch agent details:', err)
        setError('Failed to load agent details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [agentId])

  const copyToClipboard = async (text: string, label: string = 'Text') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  // 黑白灰科技风格状态配色
  const statusColors = {
    active: 'bg-[#f0fdf4] text-[#22c55e] dark:bg-[#14532d]/30 dark:text-[#4ade80]',
    inactive: 'bg-[#f5f5f5] text-[#737373] dark:bg-[#262626] dark:text-[#737373]',
    validating: 'bg-[#fefce8] text-[#eab308] dark:bg-[#422006]/30 dark:text-[#facc15]',
  }

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    validating: 'Validating',
  }

  const syncStatusColors = {
    syncing: 'bg-[#f5f5f5] text-[#525252] dark:bg-[#262626] dark:text-[#a3a3a3]',
    synced: 'bg-[#f0fdf4] text-[#22c55e] dark:bg-[#14532d]/30 dark:text-[#4ade80]',
    failed: 'bg-[#fef2f2] text-[#ef4444] dark:bg-[#450a0a]/30 dark:text-[#f87171]',
  }

  const syncStatusLabels = {
    syncing: 'Syncing',
    synced: 'Synced',
    failed: 'Failed',
  }

  if (loading) {
    return <DetailPageSkeleton />
  }

  if (error || !agent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-[#ef4444] mb-4">{error || 'Agent not found'}</p>
          <Link href="/" className="text-[#0a0a0a] dark:text-[#fafafa] hover:text-[#525252] dark:hover:text-[#a3a3a3] underline transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-5 text-xs text-[#737373] dark:text-[#737373]">
        <Link href="/" className="hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors">Home</Link>
        <span className="mx-2 text-[#d4d4d4] dark:text-[#404040]">/</span>
        <span className="text-[#0a0a0a] dark:text-[#fafafa]">Agent Details</span>
      </div>

      {/* Agent Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-2 text-[#0a0a0a] dark:text-[#fafafa]">{agent.name}</h1>
            <div className="flex items-center gap-2 text-[#737373] dark:text-[#737373]">
              {/* Network Badge */}
              {agent.network_name && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#f5f5f5] dark:bg-[#262626] rounded-full">
                  <NetworkIcon networkName={agent.network_name} className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium text-[#525252] dark:text-[#a3a3a3]">{agent.network_name}</span>
                </div>
              )}
              {agent.token_id !== undefined && agent.token_id !== null && (
                <span className="text-sm font-mono text-[#525252] dark:text-[#a3a3a3]">#{agent.token_id}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[agent.status]}`}>
              {statusLabels[agent.status]}
            </span>
            {agent.sync_status && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${syncStatusColors[agent.sync_status]}`}>
                {syncStatusLabels[agent.sync_status]}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-[#525252] dark:text-[#a3a3a3] leading-relaxed">{agent.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <h2 className="text-lg font-bold mb-4 text-[#0a0a0a] dark:text-[#fafafa]">Basic Information</h2>
            <div className="space-y-3">
              {agent.network_name && (
                <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#262626] text-sm">
                  <span className="text-[#737373] dark:text-[#737373]">Network</span>
                  <div className="flex items-center gap-1.5">
                    <NetworkIcon networkName={agent.network_name} className="w-3.5 h-3.5" />
                    <span className="font-medium text-[#0a0a0a] dark:text-[#fafafa]">{agent.network_name}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#262626] text-sm">
                <span className="text-[#737373] dark:text-[#737373]">Owner Address</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#0a0a0a] dark:text-[#fafafa]">
                    {formatAddress(agent.owner_address || agent.address)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(agent.owner_address || agent.address, 'Address')}
                    className="text-[#0a0a0a] dark:text-[#fafafa] hover:text-[#525252] dark:hover:text-[#a3a3a3] text-xs font-medium underline transition-colors"
                    title="Copy address"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#262626] text-sm">
                <span className="text-[#737373] dark:text-[#737373]">Reputation</span>
                <span className="font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                  {agent.reputation_count && agent.reputation_count > 0 ? (
                    <>
                      {agent.reputation_score.toFixed(0)}/100{' '}
                      <span className="text-xs text-[#737373] dark:text-[#737373] font-normal">
                        ({agent.reputation_count} {agent.reputation_count === 1 ? 'review' : 'reviews'})
                      </span>
                    </>
                  ) : (
                    <span className="text-[#a3a3a3] dark:text-[#525252] text-xs font-normal">
                      No reviews yet
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#262626] text-sm">
                <span className="text-[#737373] dark:text-[#737373]">Created At</span>
                <span className="text-[#0a0a0a] dark:text-[#fafafa]">{formatDate(agent.created_at)}</span>
              </div>

              <div className="flex justify-between py-2 text-sm">
                <span className="text-[#737373] dark:text-[#737373]">Last Updated</span>
                <span className="text-[#0a0a0a] dark:text-[#fafafa]">{formatDate(agent.updated_at)}</span>
              </div>
            </div>
          </Card>

          {/* OASF Taxonomy */}
          {(agent.skills && agent.skills.length > 0) || (agent.domains && agent.domains.length > 0) ? (
            <Card>
              <h2 className="text-lg font-bold mb-4 text-[#0a0a0a] dark:text-[#fafafa]">OASF Taxonomy</h2>
              <OASFDetailTags
                skills={agent.skills}
                domains={agent.domains}
                classificationSource={agent.classification_source}
              />
            </Card>
          ) : null}

          {/* Blockchain Data */}
          {agent.token_id !== undefined && agent.token_id !== null && (
            <Card>
              <h2 className="text-lg font-bold mb-4 text-[#0a0a0a] dark:text-[#fafafa]">Blockchain Data</h2>
              <div className="space-y-3">
                {agent.metadata_uri && (
                  <div className="py-2 border-b border-[#e5e5e5] dark:border-[#262626]">
                    <span className="text-[#737373] dark:text-[#737373] block mb-1">Metadata URI</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={agent.metadata_uri.startsWith('ipfs://')
                          ? `https://ipfs.io/ipfs/${agent.metadata_uri.slice(7)}`
                          : agent.metadata_uri
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0a0a0a] dark:text-[#fafafa] hover:text-[#525252] dark:hover:text-[#a3a3a3] underline text-sm font-mono break-all transition-colors"
                      >
                        {agent.metadata_uri}
                      </a>
                      <button
                        onClick={() => copyToClipboard(agent.metadata_uri!, 'Metadata URI')}
                        className="text-[#0a0a0a] dark:text-[#fafafa] hover:text-[#525252] dark:hover:text-[#a3a3a3] text-xs shrink-0 font-medium underline transition-colors"
                        title="Copy URI"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {agent.last_synced_at && (
                  <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#262626]">
                    <span className="text-[#737373] dark:text-[#737373]">Last Synced</span>
                    <span className="text-[#0a0a0a] dark:text-[#fafafa]">{formatDate(agent.last_synced_at)}</span>
                  </div>
                )}

                {agent.network_name && (
                  <div className="pt-2">
                    <a
                      href={getNftExplorerUrl(agent.network_name, agent.token_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0a0a0a] dark:text-[#fafafa] hover:text-[#525252] dark:hover:text-[#a3a3a3] underline inline-flex items-center gap-1 transition-colors"
                    >
                      View on Explorer
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* On-chain Data */}
          {agent.on_chain_data && Object.keys(agent.on_chain_data).length > 0 && (
            <Card>
              <h2 className="text-lg font-bold mb-4 text-[#0a0a0a] dark:text-[#fafafa]">On-chain Data</h2>
              <pre className="bg-[#f5f5f5] dark:bg-[#262626] p-4 rounded-lg text-sm overflow-x-auto text-[#0a0a0a] dark:text-[#fafafa] font-mono">
                {JSON.stringify(agent.on_chain_data, null, 2)}
              </pre>
            </Card>
          )}

          {/* Activity History */}
          <Card>
            <h2 className="text-lg font-bold mb-4 text-[#0a0a0a] dark:text-[#fafafa]">Activity History</h2>
            <div className="text-sm text-[#737373] dark:text-[#737373] mb-4">
              Recent activities and events for this agent
            </div>
            {/* Placeholder for activity timeline - would fetch from API in production */}
            <div className="text-center py-8 text-[#a3a3a3] dark:text-[#525252]">
              Activity timeline will be displayed here when activity data is available
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <h2 className="text-lg font-bold mb-4 text-[#0a0a0a] dark:text-[#fafafa]">Statistics</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#262626]">
                <span className="text-[#737373] dark:text-[#737373]">Status</span>
                <span className="font-semibold text-[#0a0a0a] dark:text-[#fafafa]">{statusLabels[agent.status]}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#262626]">
                <span className="text-[#737373] dark:text-[#737373]">Reputation</span>
                <span className="font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                  {agent.reputation_count && agent.reputation_count > 0 ? (
                    `${agent.reputation_score.toFixed(2)}/100`
                  ) : (
                    <span className="text-[#a3a3a3] dark:text-[#525252] text-xs font-normal">No reviews yet</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#262626]">
                <span className="text-[#737373] dark:text-[#737373]">Reviews</span>
                <span className="font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                  {agent.reputation_count && agent.reputation_count > 0 ? (
                    agent.reputation_count
                  ) : (
                    <span className="text-[#a3a3a3] dark:text-[#525252] text-xs font-normal">0</span>
                  )}
                </span>
              </div>
              {agent.token_id !== undefined && agent.token_id !== null && (
                <div className="flex justify-between py-2">
                  <span className="text-[#737373] dark:text-[#737373]">Token ID</span>
                  <span className="font-semibold font-mono text-[#0a0a0a] dark:text-[#fafafa]">#{agent.token_id}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-bold mb-4 text-[#0a0a0a] dark:text-[#fafafa]">Quick Actions</h2>
            <div className="space-y-2">
              {agent.owner_address && (
                <button
                  onClick={() => copyToClipboard(agent.owner_address!, 'Owner Address')}
                  className="w-full px-4 py-2 bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] rounded-lg hover:bg-[#262626] dark:hover:bg-[#e5e5e5] transition-colors text-sm font-medium"
                >
                  Copy Owner Address
                </button>
              )}
              {agent.metadata_uri && (
                <a
                  href={agent.metadata_uri.startsWith('ipfs://')
                    ? `https://ipfs.io/ipfs/${agent.metadata_uri.slice(7)}`
                    : agent.metadata_uri
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-[#f5f5f5] dark:bg-[#262626] text-[#0a0a0a] dark:text-[#fafafa] border border-[#e5e5e5] dark:border-[#404040] rounded-lg hover:bg-[#e5e5e5] dark:hover:bg-[#404040] transition-colors text-center text-sm font-medium"
                >
                  View Metadata
                </a>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
