'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DetailPageSkeleton } from '@/components/common/Skeleton'
import { useToast } from '@/components/common/Toast'
import { agentService } from '@/lib/api/services'
import { formatAddress, formatDate, resolveImageUrl } from '@/lib/utils/format'
import { getNftExplorerUrl } from '@/lib/utils/network'
import { NetworkIcon } from '@/components/common/NetworkIcons'
import { OASFDetailTags } from '@/components/agent/OASFTags'
import { TrustTabs } from '@/components/agent/TrustTabs'
import { LargeScoreRing, EmptyScoreRing } from '@/components/agent/ScoreRing'
import {
  InfoRow,
  CopyButton,
  statusConfig,
  syncStatusConfig,
  StatsGrid
} from '@/components/agent/AgentDetailComponents'
import { MetadataViewer } from '@/components/agent/MetadataViewer'
import { WriteReviewModal } from '@/components/agent/WriteReviewModal'
import type { Agent, MetadataResponse } from '@/types'

export default function AgentDetailPage() {
  const params = useParams()
  const agentId = params.id as string
  const toast = useToast()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Metadata state - loaded inline
  const [metadataData, setMetadataData] = useState<MetadataResponse | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Write Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const agentData = await agentService.getAgentById(agentId)
        setAgent(agentData)

        // Fetch metadata inline if agent has metadata_uri
        if (agentData.metadata_uri) {
          setMetadataLoading(true)
          try {
            const metadata = await agentService.getAgentMetadata(agentId)
            setMetadataData(metadata)
          } catch (metaErr) {
            console.error('Failed to fetch metadata:', metaErr)
            setMetadataData({
              raw_uri: agentData.metadata_uri,
              resolved_url: '',
              uri_type: 'empty',
              metadata: null,
              success: false,
              error: 'Failed to fetch metadata',
              fetch_time_ms: 0,
            })
          } finally {
            setMetadataLoading(false)
          }
        }
      } catch (err) {
        console.error('Failed to fetch agent details:', err)
        setError('Failed to load agent details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [agentId, refreshKey])

  // Handle successful review submission
  const handleReviewSuccess = useCallback(() => {
    setIsReviewModalOpen(false)
    toast.success('Review submitted successfully!')
    // Trigger data refresh
    setRefreshKey((prev) => prev + 1)
  }, [toast])

  const copyToClipboard = async (text: string, label: string = 'Text') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (loading) {
    return <DetailPageSkeleton />
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-[#fef2f2] dark:bg-[#450a0a]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#ef4444]">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">
            {error || 'Agent not found'}
          </h2>
          <p className="text-sm text-[#737373] mb-6">
            The agent you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] rounded-lg text-sm font-medium hover:bg-[#262626] dark:hover:bg-[#e5e5e5] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Agents
          </Link>
        </div>
      </div>
    )
  }

  const status = statusConfig[agent.status]

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Header section with gradient background */}
      <div className="relative border-b border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.02] dark:opacity-[0.015]"
            style={{
              background: 'radial-gradient(circle, #0a0a0a 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute -bottom-24 left-1/4 w-64 h-64 rounded-full opacity-[0.015] dark:opacity-[0.01]"
            style={{
              background: 'radial-gradient(circle, #0a0a0a 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#737373] mb-6">
            <Link href="/" className="hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors">
              Home
            </Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#d4d4d4] dark:text-[#404040]">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Link href="/agents" className="hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors">
              Agents
            </Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#d4d4d4] dark:text-[#404040]">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[#0a0a0a] dark:text-[#fafafa] font-medium truncate max-w-[200px]">
              {agent.name}
            </span>
          </nav>

          {/* Agent header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Agent avatar */}
              <div className="relative flex-shrink-0">
                {(() => {
                  const imageUrl = resolveImageUrl(metadataData?.metadata?.image as string)
                  const showImage = imageUrl && !imageError

                  return showImage ? (
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#f5f5f5] to-[#e5e5e5] dark:from-[#262626] dark:to-[#171717]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={agent.name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[#f5f5f5] to-[#e5e5e5] dark:from-[#262626] dark:to-[#171717] rounded-2xl flex items-center justify-center">
                      <span className="text-2xl lg:text-3xl font-bold text-[#a3a3a3] dark:text-[#525252]">
                        {agent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )
                })()}
                {/* Status indicator */}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${status.bg} rounded-full flex items-center justify-center border-2 border-[#fafafa] dark:border-[#0a0a0a]`}>
                  <div className={`w-2 h-2 rounded-full ${status.dot} ${agent.status === 'active' ? 'animate-pulse' : ''}`} />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl lg:text-2xl font-bold text-[#0a0a0a] dark:text-[#fafafa] truncate">
                    {agent.name}
                  </h1>
                  {agent.token_id !== undefined && agent.token_id !== null && (
                    <span className="text-sm font-mono text-[#a3a3a3] dark:text-[#525252]">
                      #{agent.token_id}
                    </span>
                  )}
                </div>

                {/* Network and status badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {agent.network_name && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626]">
                      <NetworkIcon networkName={agent.network_name} className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium text-[#525252] dark:text-[#a3a3a3]">
                        {agent.network_name}
                      </span>
                    </div>
                  )}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                  {agent.sync_status && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${syncStatusConfig[agent.sync_status].bg} ${syncStatusConfig[agent.sync_status].text}`}>
                      {syncStatusConfig[agent.sync_status].label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2">
              {agent.owner_address && (
                <button
                  onClick={() => copyToClipboard(agent.owner_address!, 'Owner Address')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] rounded-lg text-sm font-medium hover:bg-[#262626] dark:hover:bg-[#e5e5e5] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Copy Address
                </button>
              )}
              {agent.network_name && agent.token_id !== undefined && agent.token_id !== null && (
                <a
                  href={getNftExplorerUrl(agent.network_name, agent.token_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#171717] text-[#0a0a0a] dark:text-[#fafafa] border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm font-medium hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Explorer
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          {agent.description && (
            <p className="mt-4 text-sm text-[#525252] dark:text-[#a3a3a3] leading-relaxed max-w-3xl">
              {agent.description}
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6 animate-fade-in">
              <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] uppercase tracking-wider mb-4">
                Basic Information
              </h2>
              <div>
                {agent.network_name && (
                  <InfoRow
                    label="Network"
                    value={
                      <div className="flex items-center gap-1.5">
                        <NetworkIcon networkName={agent.network_name} className="w-4 h-4" />
                        <span className="font-medium">{agent.network_name}</span>
                      </div>
                    }
                  />
                )}
                <InfoRow
                  label="Owner Address"
                  value={
                    <span className="font-mono text-xs">
                      {formatAddress(agent.owner_address || agent.address, 10)}
                    </span>
                  }
                  action={<CopyButton text={agent.owner_address || agent.address} label="Address" />}
                />
                {agent.agent_wallet && (
                  <InfoRow
                    label="Agent Wallet"
                    value={
                      <span className="font-mono text-xs flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-[#dcfce7] dark:bg-[#14532d]/30 rounded">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-[#16a34a]">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        {formatAddress(agent.agent_wallet, 10)}
                      </span>
                    }
                    action={<CopyButton text={agent.agent_wallet} label="Agent Wallet" />}
                  />
                )}
                <InfoRow
                  label="Reputation"
                  value={
                    agent.reputation_count && agent.reputation_count > 0 ? (
                      <span className="font-semibold">
                        {agent.reputation_score.toFixed(0)}
                        {agent.reputation_score <= 100 && (
                          <span className="text-xs text-[#737373]">/100</span>
                        )}
                        <span className="text-xs text-[#737373] font-normal ml-1">
                          ({agent.reputation_count} {agent.reputation_count === 1 ? 'review' : 'reviews'})
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-[#a3a3a3]">No reviews yet</span>
                    )
                  }
                />
                {agent.is_active !== undefined && agent.is_active !== null && (
                  <InfoRow
                    label="Active"
                    value={
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        agent.is_active
                          ? 'text-[#16a34a]'
                          : 'text-[#dc2626]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          agent.is_active ? 'bg-[#16a34a]' : 'bg-[#dc2626]'
                        }`} />
                        {agent.is_active ? 'Yes' : 'No'}
                      </span>
                    }
                  />
                )}
                <InfoRow label="Created" value={formatDate(agent.created_at)} />
                <InfoRow
                  label="Last Updated"
                  value={formatDate(agent.updated_at)}
                  isLast={!agent.metadata_refreshed_at}
                />
                {agent.metadata_refreshed_at && (
                  <InfoRow
                    label="Metadata Refreshed"
                    value={
                      <span className="text-xs text-[#737373]">
                        {formatDate(agent.metadata_refreshed_at)}
                      </span>
                    }
                    isLast
                  />
                )}
              </div>
            </div>

            {/* OASF Taxonomy */}
            {((agent.skills && agent.skills.length > 0) || (agent.domains && agent.domains.length > 0)) && (
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] uppercase tracking-wider mb-4">
                  OASF Taxonomy
                </h2>
                <OASFDetailTags
                  skills={agent.skills}
                  domains={agent.domains}
                  classificationSource={agent.classification_source}
                />
              </div>
            )}

            {/* Agent Metadata - Inline display */}
            {agent.metadata_uri && (
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden animate-fade-in" style={{ animationDelay: '150ms' }}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#e5e5e5] dark:border-[#262626]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#525252] dark:text-[#a3a3a3]">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                          Agent Metadata
                        </h2>
                        <p className="text-xs text-[#737373] mt-0.5">
                          ERC-8004 Registration Data
                        </p>
                      </div>
                    </div>
                    {metadataData?.uri_type && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {metadataData.uri_type.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {/* Content */}
                <div className="p-6">
                  <MetadataViewer
                    metadata={metadataData?.metadata || null}
                    loading={metadataLoading}
                    error={metadataData?.error}
                    uriType={metadataData?.uri_type}
                    resolvedUrl={metadataData?.resolved_url}
                    fetchTimeMs={metadataData?.fetch_time_ms}
                  />
                </div>
              </div>
            )}

            {/* Trust & Reputation - Reviews and Validations */}
            <TrustTabs
              agentId={agent.id}
              networkName={agent.network_name}
              initialFeedbackCount={agent.reputation_count || 0}
            />
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-6">
            {/* Trust Score Card */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] uppercase tracking-wider mb-6">
                Trust Score
              </h2>

              {/* Large Score Ring */}
              <div className="flex justify-center mb-6">
                {agent.reputation_count && agent.reputation_count > 0 ? (
                  <LargeScoreRing score={agent.reputation_score} size={120} />
                ) : (
                  <EmptyScoreRing size={120} large />
                )}
              </div>

              {/* Stats Grid */}
              <StatsGrid
                reviewCount={agent.reputation_count || 0}
                statusLabel={status.label}
                statusTextClass={status.text}
              />

              {/* Token ID */}
              {agent.token_id !== undefined && agent.token_id !== null && (
                <div className="mt-4 pt-4 border-t border-[#f5f5f5] dark:border-[#1f1f1f]">
                  <InfoRow
                    label="Token ID"
                    value={<span className="font-mono">#{agent.token_id}</span>}
                    isLast
                  />
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <h2 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] uppercase tracking-wider mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                {/* Write Review - Primary action */}
                {agent.token_id !== undefined && agent.token_id !== null && (
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a] rounded-lg text-sm font-medium hover:bg-[#262626] dark:hover:bg-[#e5e5e5] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Write Review
                  </button>
                )}
                {agent.owner_address && (
                  <button
                    onClick={() => copyToClipboard(agent.owner_address!, 'Owner Address')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f5f5f5] dark:bg-[#262626] text-[#0a0a0a] dark:text-[#fafafa] rounded-lg text-sm font-medium hover:bg-[#e5e5e5] dark:hover:bg-[#404040] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                    </svg>
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f5f5f5] dark:bg-[#262626] text-[#0a0a0a] dark:text-[#fafafa] rounded-lg text-sm font-medium hover:bg-[#e5e5e5] dark:hover:bg-[#404040] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    View Metadata
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Write Review Modal */}
      {agent.token_id !== undefined && agent.token_id !== null && (
        <WriteReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          agentId={agent.token_id}
          agentName={agent.name}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  )
}
