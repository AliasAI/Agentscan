'use client'

import { NetworkBinanceSmartChain } from '@web3icons/react'

import type { BnbAgentScanResponse, BnbAgentEvent } from '@/types'
import { BNB_AGENT_OFFICIAL_LINKS } from './bnbAgentLinks'

function formatInt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '--'
  return Math.round(value).toLocaleString()
}

function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '--'
  return `${value.toFixed(2)}%`
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '--'
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms) || ms < 0) return '--'
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function shortHash(value: string | null | undefined): string {
  if (!value) return '--'
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function learningTop(scan: BnbAgentScanResponse | null) {
  const rows = Object.entries(scan?.nfascan.bap578.learningModelBreakdown ?? {})
  return rows.sort((a, b) => b[1] - a[1]).slice(0, 5)
}

export default function BnbAgentSection({
  scan,
  loading,
}: {
  scan: BnbAgentScanResponse | null
  loading: boolean
}) {
  const agentscan = scan?.agentscan
  const nfascan = scan?.nfascan
  const execution = scan?.execution
  const sdk = scan?.sdk
  const latestNfaBlockTime = nfascan?.recent_blocks[0]?.timestamp ?? nfascan?.health.lastSyncTime

  return (
    <section className="mt-8 rounded-[32px] border border-[#f0d675] bg-[#fffdf5] p-6 shadow-sm dark:border-[#4a3b12] dark:bg-[#15130b] sm:p-8">
      <div className="mb-8 flex flex-col gap-4 border-b border-[#f4e7aa] pb-6 md:flex-row md:items-end md:justify-between dark:border-[#30270e]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#f0b90b]/15 ring-1 ring-[#f0b90b]/30">
              <NetworkBinanceSmartChain size={48} variant="branded" aria-label="BNB Chain" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold leading-none text-[#0a0a0a] dark:text-[#fafafa]">
                BNB Chain
              </span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a6a00] dark:text-[#f0b90b]">
                Agent stack
              </span>
            </div>
            <span className="rounded-full bg-[#f0b90b] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0a0a0a]">
              Live stack
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a] dark:text-[#fafafa]">BNB Agent Stack</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#525252] dark:text-[#b8b19b]">
            BNB has three different agent signals that should not be mixed together:
            ERC-8004 identity on Agentscan, BAP-578/NFA verification on NfaSCAN,
            and BNBAgent SDK/APEX execution readiness on BSC testnet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-medium">
          {BNB_AGENT_OFFICIAL_LINKS.map((link) => <ExternalButton key={link.href} {...link} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Agentscan BNB ERC-8004"
          value={formatInt(agentscan?.agent_count)}
          hint={`${formatPct(agentscan?.share_pct)} of local Agentscan index`}
          loading={loading}
        />
        <MetricCard
          label="NfaSCAN BAP-578"
          value={formatInt(nfascan?.bap578.bap578Agents)}
          hint={`${formatInt(nfascan?.bap578.erc8004Registered)} ERC-8004-linked NFAs`}
          loading={loading}
        />
        <MetricCard
          label="NfaSCAN Events"
          value={formatInt(nfascan?.stats.totalEvents)}
          hint={`${formatInt(nfascan?.stats.totalReceipts)} receipts indexed`}
          loading={loading}
        />
        <MetricCard
          label="APEX ERC-8183 Jobs"
          value={formatInt(execution?.job_counter)}
          hint={`${execution?.network ?? 'BSC Testnet'} execution contract`}
          loading={loading}
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <LayerCard
          title="Identity"
          status={scan?.maturity.identity_layer.status ?? 'loading'}
          body={scan?.maturity.identity_layer.evidence ?? 'Reading local ERC-8004 index'}
        />
        <LayerCard
          title="NFA Verification"
          status={scan?.maturity.bap578_layer.status ?? 'loading'}
          body={scan?.maturity.bap578_layer.evidence ?? 'Reading NfaSCAN telemetry'}
        />
        <LayerCard
          title="Execution"
          status={scan?.maturity.execution_layer.status ?? 'loading'}
          body={scan?.maturity.execution_layer.evidence ?? 'Reading APEX testnet state'}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-2xl border border-[#f4e7aa] dark:border-[#30270e]">
          <TableTitle title="Live Footprint" />
          <table className="w-full text-left text-[13px]">
            <tbody className="divide-y divide-[#f4e7aa] bg-white dark:divide-[#30270e] dark:bg-[#15130b]">
              <InfoRow label="BNB quality agents" value={`${formatInt(agentscan?.quality_agents)} (${formatPct(agentscan?.quality_pct)})`} />
              <InfoRow label="BNB reputation agents" value={`${formatInt(agentscan?.reputation_agents)} (${formatPct(agentscan?.reputation_pct)})`} />
              <InfoRow label="Unique owners" value={formatInt(agentscan?.unique_owners)} />
              <InfoRow label="Agentscan sync" value={`${agentscan?.sync.status ?? '--'} at block ${formatInt(agentscan?.sync.current_block)}`} />
              <InfoRow label="NfaSCAN health" value={`${nfascan?.health.status ?? '--'} / ${nfascan?.health.syncMode ?? '--'}`} />
              <InfoRow label="NfaSCAN latest block" value={`${formatInt(nfascan?.stats.latestBlock)} (${formatRelative(latestNfaBlockTime)})`} />
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-[#f4e7aa] bg-white p-5 dark:border-[#30270e] dark:bg-[#17140a]">
          <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
            BAP-578 Verification
          </h3>
          <p className="mt-2 text-[12px] leading-relaxed text-[#525252] dark:text-[#b8b19b]">
            BAP-578 turns an AI agent into a Non-Fungible Agent: a tradeable,
            ownable contract asset that can carry ERC-8004 identity and learning proofs.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
            <MiniStat label="Merkle learning" value={formatInt(nfascan?.bap578.merkleLearningAgents)} />
            <MiniStat label="JSON light" value={formatInt(nfascan?.bap578.jsonLightAgents)} />
            <MiniStat label="Indexed contracts" value={formatInt(nfascan?.bap578.indexedContracts)} />
            <MiniStat label="Mint fee" value={`${nfascan?.contract.mintFeeBNB ?? '--'} BNB`} />
          </div>
          <div className="mt-4 space-y-1.5">
            {learningTop(scan).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-[11px] text-[#737373] dark:text-[#928b76]">
                <span>{name.replaceAll('_', ' ')}</span>
                <span className="font-mono text-[#0a0a0a] dark:text-[#fafafa]">{formatInt(count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ExecutionPanel scan={scan} loading={loading} />
        <RecentEvents rows={nfascan?.recent_events ?? []} loading={loading} />
      </div>

      <div className="mt-6 rounded-2xl border border-[#f4e7aa] bg-white p-5 dark:border-[#30270e] dark:bg-[#17140a]">
        <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">SDK Activity</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <MiniStat label="Latest release" value={sdk?.latest_release?.tag_name ?? '--'} />
          <MiniStat label="Open PRs" value={formatInt(sdk?.open_pull_requests.length)} />
          <MiniStat label="Last push" value={formatRelative(sdk?.repo.pushed_at)} />
        </div>
        <div className="mt-4 space-y-2">
          {(sdk?.open_pull_requests ?? []).slice(0, 3).map((pr) => (
            <a
              key={pr.number}
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[12px] text-[#525252] underline decoration-dotted underline-offset-2 hover:text-[#0a0a0a] dark:text-[#b8b19b] dark:hover:text-[#fafafa]"
            >
              #{pr.number} {pr.title}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function MetricCard({ label, value, hint, loading }: { label: string; value: string; hint: string; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-[#f4e7aa] bg-white p-5 dark:border-[#30270e] dark:bg-[#17140a]">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8a6a00] dark:text-[#d8b43a]">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-[#0a0a0a] dark:text-[#fafafa]">
        {loading ? <div className="h-7 w-24 animate-pulse rounded bg-[#f5e8aa] dark:bg-[#30270e]" /> : value}
      </div>
      <div className="mt-1.5 text-[11px] text-[#737373] dark:text-[#928b76]">{hint}</div>
    </div>
  )
}

function LayerCard({ title, status, body }: { title: string; status: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#f4e7aa] bg-white p-5 dark:border-[#30270e] dark:bg-[#17140a]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a47a00] dark:text-[#f0b90b]">{status.replaceAll('_', ' ')}</div>
      <h3 className="mt-2 text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">{title}</h3>
      <p className="mt-2 text-[12px] leading-relaxed text-[#525252] dark:text-[#b8b19b]">{body}</p>
    </div>
  )
}

function ExecutionPanel({ scan, loading }: { scan: BnbAgentScanResponse | null; loading: boolean }) {
  const execution = scan?.execution
  return (
    <div className="rounded-2xl border border-[#f4e7aa] bg-white p-5 dark:border-[#30270e] dark:bg-[#17140a]">
      <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">Execution Readiness</h3>
      <p className="mt-2 text-[12px] leading-relaxed text-[#525252] dark:text-[#b8b19b]">
        ERC-8183/APEX is active on BSC testnet, but the default contract has no
        completed job volume yet. Treat this as infrastructure readiness, not mature usage.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
        <MiniStat label="jobCounter" value={loading ? '--' : formatInt(execution?.job_counter)} />
        <MiniStat label="paused" value={execution?.paused == null ? '--' : String(execution.paused)} />
        <MiniStat label="testnet block" value={formatInt(execution?.latest_block)} />
        <MiniStat label="code bytes" value={formatInt(execution?.code_bytes)} />
      </div>
      <div className="mt-4 text-[11px] text-[#737373] dark:text-[#928b76]">
        ERC-8183: <span className="font-mono">{shortHash(execution?.erc8183_contract)}</span>
        <br />
        UMA/APEX evaluator: <span className="font-mono">{shortHash(execution?.apex_evaluator)}</span>
      </div>
    </div>
  )
}

function RecentEvents({ rows, loading }: { rows: BnbAgentEvent[]; loading: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#f4e7aa] dark:border-[#30270e]">
      <TableTitle title="Recent NfaSCAN Events" />
      <table className="w-full text-left text-[13px]">
        <tbody className="divide-y divide-[#f4e7aa] bg-white dark:divide-[#30270e] dark:bg-[#15130b]">
          {loading && rows.length === 0 ? (
            <tr><td className="px-4 py-6 text-[#737373]">Loading events...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td className="px-4 py-6 text-[#737373]">No events returned.</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="transition hover:bg-[#fffdf5] dark:hover:bg-[#1c180c]">
              <td className="px-4 py-3">
                <a href={`https://bscscan.com/tx/${row.txHash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[#0a0a0a] underline decoration-dotted underline-offset-2 dark:text-[#fafafa]">
                  {shortHash(row.txHash)}
                </a>
                <div className="mt-0.5 text-[11px] text-[#737373]">{row.method} at block {formatInt(row.blockNumber)}</div>
              </td>
              <td className="hidden px-4 py-3 text-right text-[#737373] md:table-cell">{formatRelative(row.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <tr><td className="px-4 py-3 text-[#737373]">{label}</td><td className="px-4 py-3 text-right font-mono text-[#0a0a0a] dark:text-[#fafafa]">{value}</td></tr>
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[10px] uppercase tracking-[0.14em] text-[#a47a00] dark:text-[#f0b90b]">{label}</div><div className="mt-1 break-words font-mono text-[13px] text-[#0a0a0a] dark:text-[#fafafa]">{value}</div></div>
}

function TableTitle({ title }: { title: string }) {
  return <div className="bg-[#fff8dc] px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-[#8a6a00] dark:bg-[#201a09] dark:text-[#d8b43a]">{title}</div>
}

function ExternalButton({ href, label, tooltip }: { href: string; label: string; tooltip: string }) {
  return <a href={href} title={tooltip} target="_blank" rel="noopener noreferrer" className="group relative rounded-full bg-[#f5e8aa] px-4 py-1.5 text-[#5f4700] transition hover:bg-[#efd36c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0b90b] dark:bg-[#30270e] dark:text-[#fcd34d] dark:hover:bg-[#443713]">{label}<span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-72 -translate-x-1/2 rounded-lg border border-[#f0d675] bg-[#0a0a0a] px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-[#fafafa] shadow-xl group-hover:block group-focus-visible:block dark:border-[#4a3b12]">{tooltip}</span></a>
}
