'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { ecosystemService } from '@/lib/api/services'
import type { BnbAgentScanResponse, VirtualsAcpScanResponse } from '@/types'
import BnbAgentSection from './components/BnbAgentSection'

const REFRESH_MS = 4 * 60 * 60 * 1000

function formatCompact(value: number | null | undefined, prefix = ''): string {
  if (value == null || isNaN(value)) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1e9) return `${sign}${prefix}${(abs / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${sign}${prefix}${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sign}${prefix}${(abs / 1e3).toFixed(2)}K`
  return `${sign}${prefix}${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function formatInt(value: number | null | undefined): string {
  if (value == null) return '—'
  return Math.round(value).toLocaleString()
}

function formatPct(value: number | null | undefined, digits = 2): string {
  if (value == null || isNaN(value)) return '—'
  return `${value.toFixed(digits)}%`
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  if (isNaN(ms) || ms < 0) return '—'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

function parseJobContent(content: string | null): string {
  if (!content) return ''
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && 'name' in parsed) {
      return parsed.name as string
    }
  } catch {
    // Non-JSON content — treat as plain text
  }
  return content.length > 60 ? `${content.slice(0, 60)}…` : content
}

export default function EcosystemsPageClient() {
  const [scan, setScan] = useState<VirtualsAcpScanResponse | null>(null)
  const [bnbScan, setBnbScan] = useState<BnbAgentScanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const [acpResult, bnbResult] = await Promise.allSettled([
        ecosystemService.getVirtualsAcpScan(10, 10),
        ecosystemService.getBnbAgentScan(6, 4, 5),
      ])
      if (cancelled) return

      if (acpResult.status === 'fulfilled') {
        setScan(acpResult.value)
      } else {
        console.error('Failed to load Virtuals ACP data:', acpResult.reason)
      }

      if (bnbResult.status === 'fulfilled') {
        setBnbScan(bnbResult.value)
      } else {
        console.error('Failed to load BNB Agent data:', bnbResult.reason)
      }

      const failed = acpResult.status === 'rejected' || bnbResult.status === 'rejected'
      setError(failed ? 'Some live ecosystem data failed to refresh.' : null)
      setLoading(false)
    }
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Header />

      <div className="container mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800/50 dark:bg-red-900/10 dark:text-red-400">
            {error}
          </div>
        )}

        <VirtualsAcpSection scan={scan} loading={loading} />

        <BnbAgentSection scan={bnbScan} loading={loading} />

        <div className="mt-12 mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e5e5e5] dark:bg-[#262626]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#737373]">
            On the roadmap
          </span>
          <div className="h-px flex-1 bg-[#e5e5e5] dark:bg-[#262626]" />
        </div>

        <div className="grid gap-6 md:grid-cols-1">
          <UpcomingTile
            title="x402 + Coinbase CDP — Machine Payments"
            logoSrc="/brand-assets/coinbase-wordmark.svg"
            logoAlt="Coinbase"
            logoWidth={96}
            logoHeight={18}
            badgeClass="bg-[#d1fae5] text-[#065f46] dark:bg-[#15352a] dark:text-[#6ee7b7]"
            summary="x402 revives HTTP's dormant Payment Required status as the handshake for agent-to-agent commerce: any endpoint can return a signed price quote, the caller pays stablecoin on Base, and the same request replays with proof-of-payment. Paired with Coinbase's CDP AgentKit, it gives agents programmable wallets for autonomous API buying."
            bullets={[
              'Who it serves - API providers and autonomous buyers that need micropayments without accounts, subscriptions, or OAuth.',
              'What we want to measure - count of agents exposing 402-gated endpoints and those with CDP wallet provisioning signatures.',
              'Why not yet - there is no registry of x402 endpoints; signals live in the agent metadata and HTTP headers, requiring per-agent probing rather than a single feed.',
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function VirtualsAcpSection({
  scan,
  loading,
}: {
  scan: VirtualsAcpScanResponse | null
  loading: boolean
}) {
  const metrics = scan?.metrics
  return (
    <section className="rounded-[32px] border border-[#e5e5e5] bg-white p-6 shadow-sm dark:border-[#262626] dark:bg-[#121212] sm:p-8">
      <div className="mb-8 flex flex-col gap-4 border-b border-[#f0f0f0] pb-6 md:flex-row md:items-end md:justify-between dark:border-[#1f1f1f]">
        <div>
          <div className="mb-4 flex h-8 items-center">
            <Image
              src="/brand-assets/virtuals-wordmark.svg"
              alt="Virtuals Protocol"
              width={120}
              height={28}
              className="h-auto w-auto max-h-7 object-contain object-left"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a] dark:text-[#fafafa]">
            Virtuals ACP — Agent Commerce
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#525252] dark:text-[#a3a3a3]">
            The Agentic Commerce Protocol is the marketplace layer of the agent economy.
            Agents publish <em>offerings</em> (bridge, swap, alpha calls, content generation, …)
            with fixed prices, get <em>hired</em> by other agents or humans, and settle in
            escrow only after the job reaches its completed phase. Every KPI below is a real
            unit of economic activity — not model calls or impressions.
          </p>
          <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-[#737373]">
            Data proxied live from{' '}
            <code className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-[11px] text-[#0a0a0a] dark:bg-[#262626] dark:text-[#fafafa]">
              acpx.virtuals.io
            </code>
            , cached 4h. Metric definitions follow the{' '}
            <a
              href="https://whitepaper.virtuals.io/acp/acp-glossary"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted underline-offset-2"
            >
              official ACP glossary
            </a>
            .
          </p>
        </div>
        <div className="flex gap-2 text-[11px] font-medium">
          <a
            href="https://app.virtuals.io/acp/scan"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#f0f0f0] px-4 py-1.5 text-[#0a0a0a] transition hover:bg-[#e5e5e5] dark:bg-[#262626] dark:text-[#fafafa] dark:hover:bg-[#333333]"
          >
            Open ACP Scan ↗
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total aGDP"
          value={formatCompact(metrics?.total_agdp?.value ?? null, '$')}
          delta={metrics?.total_agdp?.delta_pct_30d ?? null}
          hint="gross value routed through agents — trading volume + all service fees"
          loading={loading}
        />
        <KpiCard
          label="Total Revenue"
          value={formatCompact(metrics?.total_revenue?.value ?? null, '$')}
          delta={metrics?.total_revenue?.delta_pct_30d ?? null}
          hint="fees agents kept for services rendered — the real income line"
          loading={loading}
        />
        <KpiCard
          label="Total Jobs"
          value={formatCompact(metrics?.total_jobs?.value ?? null)}
          delta={metrics?.total_jobs?.delta_pct_30d ?? null}
          hint="jobs that reached the completed phase — successful end-to-end deliveries"
          loading={loading}
        />
        <KpiCard
          label="Unique Active Wallets"
          value={formatCompact(metrics?.total_active_wallets?.value ?? null)}
          delta={metrics?.total_active_wallets?.delta_pct_30d ?? null}
          hint="distinct wallets that hired at least one agent — demand-side reach"
          loading={loading}
        />
      </div>

      <TopAgentsTable scan={scan} loading={loading} />
      <RecentTransactions scan={scan} loading={loading} />
    </section>
  )
}

function KpiCard({
  label,
  value,
  delta,
  hint,
  loading,
}: {
  label: string
  value: string
  delta: number | null
  hint: string
  loading: boolean
}) {
  const positive = delta != null && delta >= 0
  return (
    <div className="rounded-2xl border border-[#f0f0f0] bg-[#fafafa] p-5 dark:border-[#1f1f1f] dark:bg-[#171717]">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#737373]">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-[#0a0a0a] dark:text-[#fafafa]">
        {loading ? <div className="h-7 w-24 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#262626]" /> : value}
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[11px]">
        {delta == null ? (
          <span className="text-[#a3a3a3]">30D · —</span>
        ) : (
          <span
            className={
              positive
                ? 'font-mono text-green-600 dark:text-green-400'
                : 'font-mono text-red-600 dark:text-red-400'
            }
          >
            {positive ? '▲' : '▼'} {formatPct(Math.abs(delta))}
            <span className="ml-1 text-[#a3a3a3]">30D</span>
          </span>
        )}
        <span className="text-[#a3a3a3]">· {hint}</span>
      </div>
    </div>
  )
}

function TopAgentsTable({ scan, loading }: { scan: VirtualsAcpScanResponse | null; loading: boolean }) {
  const rows = scan?.top_agents ?? []
  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#7c3aed]" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a3a3a3]">
            Top Agents
          </h3>
        </div>
        <a
          href="https://app.virtuals.io/acp/scan"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-[#737373] underline-offset-2 hover:underline"
        >
          View full leaderboard ↗
        </a>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#ebebeb] dark:border-[#2b2b2b]">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#fafafa] text-[11px] uppercase tracking-wider text-[#737373] dark:bg-[#171717]">
            <tr>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 text-right font-medium">aGDP</th>
              <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Jobs</th>
              <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Unique Users</th>
              <th className="hidden px-4 py-3 text-right font-medium lg:table-cell">Success Rate</th>
              <th className="hidden px-4 py-3 text-right font-medium lg:table-cell">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0] bg-white dark:divide-[#1f1f1f] dark:bg-[#121212]">
            {loading && rows.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-5 w-full animate-pulse rounded bg-[#ececec] dark:bg-[#262626]" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#737373]">
                  No agents returned from upstream.
                </td>
              </tr>
            ) : (
              rows.map((agent) => (
                <tr key={`${agent.id}-${agent.name}`} className="transition hover:bg-[#fafafa] dark:hover:bg-[#171717]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {agent.profile_pic ? (
                        <img
                          src={agent.profile_pic}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[#ececec] dark:bg-[#262626]" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[#0a0a0a] dark:text-[#fafafa]">
                          {agent.name ?? '—'}
                        </div>
                        {agent.tag && (
                          <div className="truncate text-[11px] text-[#737373]">{agent.tag}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#0a0a0a] dark:text-[#fafafa]">
                    {formatCompact(agent.agdp, '$')}
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono text-[#525252] dark:text-[#a3a3a3] md:table-cell">
                    {formatInt(agent.successful_jobs)}
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono text-[#525252] dark:text-[#a3a3a3] md:table-cell">
                    {formatInt(agent.unique_buyers)}
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono lg:table-cell">
                    {agent.success_rate == null ? (
                      <span className="text-[#a3a3a3]">—</span>
                    ) : (
                      <span
                        className={
                          agent.success_rate >= 95
                            ? 'text-green-600 dark:text-green-400'
                            : agent.success_rate >= 80
                            ? 'text-[#0a0a0a] dark:text-[#fafafa]'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }
                      >
                        {formatPct(agent.success_rate, 1)}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-[#737373] lg:table-cell">
                    {formatRelative(agent.last_active_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RecentTransactions({ scan, loading }: { scan: VirtualsAcpScanResponse | null; loading: boolean }) {
  const rows = scan?.recent_transactions ?? []
  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a3a3a3]">
          Recent Transactions <span className="font-normal text-[#a3a3a3]">(agent ↔ agent)</span>
        </h3>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#ebebeb] dark:border-[#2b2b2b]">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#fafafa] text-[11px] uppercase tracking-wider text-[#737373] dark:bg-[#171717]">
            <tr>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">From</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">To</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0] bg-white dark:divide-[#1f1f1f] dark:bg-[#121212]">
            {loading && rows.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-5 w-full animate-pulse rounded bg-[#ececec] dark:bg-[#262626]" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[13px] text-[#737373]">
                  No interactions in upstream feed.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={`${row.id}-${i}`} className="transition hover:bg-[#fafafa] dark:hover:bg-[#171717]">
                  <td className="whitespace-nowrap px-4 py-3 text-[#737373]">{formatRelative(row.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="truncate text-[#0a0a0a] dark:text-[#fafafa]">{parseJobContent(row.content)}</div>
                    {row.type && (
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[#a3a3a3]">{row.type}</div>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">{row.from_agent?.name ?? '—'}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{row.to_agent?.name ?? '—'}</td>
                  <td className="hidden px-4 py-3 font-mono text-[11px] lg:table-cell">
                    {row.tx_hash ? (
                      <a
                        href={`https://basescan.org/tx/${row.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#525252] underline decoration-dotted underline-offset-2 hover:text-[#0a0a0a] dark:text-[#a3a3a3] dark:hover:text-[#fafafa]"
                      >
                        {row.tx_hash.slice(0, 6)}…{row.tx_hash.slice(-4)}
                      </a>
                    ) : (
                      <span className="text-[#a3a3a3]">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="border-b border-[#e5e5e5] bg-white dark:border-[#262626] dark:bg-[#0f0f0f]">
      <div className="container mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <nav className="mb-6 flex items-center gap-2 text-xs text-[#737373]">
          <Link href="/" className="transition-colors hover:text-[#0a0a0a] dark:hover:text-[#fafafa]">
            Home
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#d4d4d4] dark:text-[#404040]">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-medium text-[#0a0a0a] dark:text-[#fafafa]">Ecosystems</span>
        </nav>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#fafafa] px-3 py-1 text-[11px] font-medium text-[#525252] dark:border-[#262626] dark:bg-[#171717] dark:text-[#a3a3a3]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Live · proxied · refreshes every 4h
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#0a0a0a] dark:text-[#fafafa] lg:text-4xl">
              Agent Economy Ecosystems
            </h1>
            <p className="text-[15px] leading-relaxed text-[#525252] dark:text-[#a3a3a3]">
              Autonomous agents need three things to transact: a way to advertise services,
              a way to execute them on-chain, and a way to settle payment without a human.
              We track the most credible protocol for each — Virtuals ACP for commerce,
              BNB ERC-8183 for execution, and x402 + Coinbase CDP for payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function UpcomingTile({
  title,
  logoSrc,
  logoAlt,
  logoWidth,
  logoHeight,
  badgeClass,
  summary,
  bullets,
}: {
  title: string
  logoSrc: string
  logoAlt: string
  logoWidth: number
  logoHeight: number
  badgeClass: string
  summary: string
  bullets: string[]
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d4d4d4] bg-white p-6 dark:border-[#2f2f2f] dark:bg-[#121212]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-8 items-center">
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={logoWidth}
            height={logoHeight}
            className="h-auto w-auto max-h-7 object-contain object-left opacity-80"
          />
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${badgeClass}`}>
          Coming soon
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[#525252] dark:text-[#a3a3a3]">{summary}</p>
      <ul className="mt-4 space-y-1.5 text-[12px] text-[#737373]">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-[#a3a3a3]">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
