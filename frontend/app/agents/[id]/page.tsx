'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/common/Card'
import { DetailPageSkeleton } from '@/components/common/Skeleton'
import { useToast } from '@/components/common/Toast'
import { agentService } from '@/lib/api/services'
import { formatAddress, formatDate } from '@/lib/utils/format'
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

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    validating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  }

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    validating: 'Validating',
  }

  const syncStatusColors = {
    syncing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    synced: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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
          <p className="text-red-600 mb-4">{error || 'Agent not found'}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-foreground/60">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <span>Agent Details</span>
      </div>

      {/* Agent Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{agent.name}</h1>
            {agent.token_id !== undefined && agent.token_id !== null && (
              <p className="text-lg text-foreground/60">
                Token ID: #{agent.token_id}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[agent.status]}`}>
              {statusLabels[agent.status]}
            </span>
            {agent.sync_status && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${syncStatusColors[agent.sync_status]}`}>
                {syncStatusLabels[agent.sync_status]}
              </span>
            )}
          </div>
        </div>
        <p className="text-foreground/80">{agent.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                <span className="text-foreground/60">Owner Address</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">
                    {formatAddress(agent.owner_address || agent.address)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(agent.owner_address || agent.address, 'Address')}
                    className="text-blue-600 hover:text-blue-700 text-xs"
                    title="Copy address"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                <span className="text-foreground/60">Reputation</span>
                <span className="font-semibold">
                  {agent.reputation_count && agent.reputation_count > 0 ? (
                    <>
                      {agent.reputation_score.toFixed(0)}/100{' '}
                      <span className="text-sm text-foreground/60 font-normal">
                        ({agent.reputation_count} {agent.reputation_count === 1 ? 'review' : 'reviews'})
                      </span>
                    </>
                  ) : (
                    <span className="text-foreground/50 text-sm font-normal">
                      No reviews yet
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                <span className="text-foreground/60">Created At</span>
                <span>{formatDate(agent.created_at)}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-foreground/60">Last Updated</span>
                <span>{formatDate(agent.updated_at)}</span>
              </div>
            </div>
          </Card>

          {/* OASF Taxonomy */}
          {(agent.skills && agent.skills.length > 0) || (agent.domains && agent.domains.length > 0) ? (
            <Card>
              <h2 className="text-xl font-bold mb-4">OASF Taxonomy</h2>
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
              <h2 className="text-xl font-bold mb-4">Blockchain Data</h2>
              <div className="space-y-3">
                {agent.metadata_uri && (
                  <div className="py-2 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-foreground/60 block mb-1">Metadata URI</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={agent.metadata_uri.startsWith('ipfs://')
                          ? `https://ipfs.io/ipfs/${agent.metadata_uri.slice(7)}`
                          : agent.metadata_uri
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-mono break-all"
                      >
                        {agent.metadata_uri}
                      </a>
                      <button
                        onClick={() => copyToClipboard(agent.metadata_uri!, 'Metadata URI')}
                        className="text-blue-600 hover:text-blue-700 text-xs shrink-0"
                        title="Copy URI"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {agent.last_synced_at && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-foreground/60">Last Synced</span>
                    <span>{formatDate(agent.last_synced_at)}</span>
                  </div>
                )}

                <div className="pt-2">
                  <a
                    href={`https://sepolia.etherscan.io/nft/0x8004a6090Cd10A7288092483047B097295Fb8847/${agent.token_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    View on Etherscan
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </Card>
          )}

          {/* On-chain Data */}
          {agent.on_chain_data && Object.keys(agent.on_chain_data).length > 0 && (
            <Card>
              <h2 className="text-xl font-bold mb-4">On-chain Data</h2>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(agent.on_chain_data, null, 2)}
              </pre>
            </Card>
          )}

          {/* Activity History */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Activity History</h2>
            <div className="text-sm text-foreground/60 mb-4">
              Recent activities and events for this agent
            </div>
            {/* Placeholder for activity timeline - would fetch from API in production */}
            <div className="text-center py-8 text-foreground/60">
              Activity timeline will be displayed here when activity data is available
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                <span className="text-foreground/60">Status</span>
                <span className="font-semibold">{statusLabels[agent.status]}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                <span className="text-foreground/60">Reputation</span>
                <span className="font-semibold">
                  {agent.reputation_count && agent.reputation_count > 0 ? (
                    `${agent.reputation_score.toFixed(2)}/100`
                  ) : (
                    <span className="text-foreground/50 text-sm font-normal">No reviews yet</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                <span className="text-foreground/60">Reviews</span>
                <span className="font-semibold">
                  {agent.reputation_count && agent.reputation_count > 0 ? (
                    agent.reputation_count
                  ) : (
                    <span className="text-foreground/50 text-sm font-normal">0</span>
                  )}
                </span>
              </div>
              {agent.token_id !== undefined && agent.token_id !== null && (
                <div className="flex justify-between py-2">
                  <span className="text-foreground/60">Token ID</span>
                  <span className="font-semibold">#{agent.token_id}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {agent.owner_address && (
                <button
                  onClick={() => copyToClipboard(agent.owner_address!, 'Owner Address')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
                  className="block w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-center"
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
