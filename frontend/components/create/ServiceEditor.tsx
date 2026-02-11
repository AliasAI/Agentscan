'use client'

/**
 * ServiceEditor - Protocol-aware service manager for ERC-8004 Registration
 *
 * Supports: MCP, A2A, OASF, ENS, DID, agentWallet
 * Each protocol type renders its own field set.
 */

import { useState } from 'react'
import { TaxonomySelector } from './TaxonomySelector'
import type { ServiceInput, ServiceType } from '@/types'

interface ServiceEditorProps {
  services: ServiceInput[]
  onChange: (services: ServiceInput[]) => void
  disabled?: boolean
}

// Protocol metadata for UI display
const PROTOCOL_META: Record<ServiceType, { label: string; color: string; singular: boolean }> = {
  MCP:         { label: 'MCP',          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', singular: false },
  A2A:         { label: 'A2A',          color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', singular: false },
  OASF:        { label: 'OASF',         color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', singular: true },
  ENS:         { label: 'ENS',          color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300', singular: true },
  DID:         { label: 'DID',          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', singular: true },
  agentWallet: { label: 'agentWallet',  color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', singular: true },
}

function createDefault(type: ServiceType): ServiceInput {
  switch (type) {
    case 'MCP': return { name: 'MCP', endpoint: '', version: '2025-06-18', mcpTools: [] }
    case 'A2A': return { name: 'A2A', endpoint: '', version: '0.2.1' }
    case 'OASF': return { name: 'OASF', endpoint: '', version: '0.8', skills: [], domains: [] }
    case 'ENS': return { name: 'ENS', endpoint: '', version: '1.0' }
    case 'DID': return { name: 'DID', endpoint: '', version: '1.0' }
    case 'agentWallet': return { name: 'agentWallet', endpoint: '' }
  }
}

export function ServiceEditor({ services, onChange, disabled = false }: ServiceEditorProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const addService = (type: ServiceType) => {
    onChange([...services, createDefault(type)])
    setMenuOpen(false)
  }

  const removeService = (index: number) => {
    onChange(services.filter((_, i) => i !== index))
  }

  const updateService = (index: number, updated: ServiceInput) => {
    const next = [...services]
    next[index] = updated
    onChange(next)
  }

  // Check which singular types are already added
  const existingTypes = new Set(services.map((s) => s.name))

  const availableTypes = (Object.keys(PROTOCOL_META) as ServiceType[]).filter((type) => {
    const meta = PROTOCOL_META[type]
    return !meta.singular || !existingTypes.has(type)
  })

  return (
    <div className="space-y-4">
      {services.map((service, index) => (
        <ServiceCard
          key={`${service.name}-${index}`}
          service={service}
          index={index}
          onUpdate={(updated) => updateService(index, updated)}
          onRemove={() => removeService(index)}
          disabled={disabled}
        />
      ))}

      {/* Add Service button */}
      {!disabled && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full py-2 text-sm font-medium text-[#6e6e73] dark:text-[#86868b]
                     border border-dashed border-[#d4d4d4] dark:border-[#525252] rounded-lg
                     hover:border-[#0a0a0a] dark:hover:border-[#fafafa]
                     hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors
                     flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Service
          </button>

          {menuOpen && (
            <AddServiceMenu
              availableTypes={availableTypes}
              onSelect={addService}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Service Card ────────────────────────────────────────

interface ServiceCardProps {
  service: ServiceInput
  index: number
  onUpdate: (s: ServiceInput) => void
  onRemove: () => void
  disabled: boolean
}

function ServiceCard({ service, index, onUpdate, onRemove, disabled }: ServiceCardProps) {
  const meta = PROTOCOL_META[service.name]

  return (
    <div className="p-4 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-xs text-[#a3a3a3]">#{index + 1}</span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {service.name === 'MCP' && <MCPFields service={service} onUpdate={onUpdate} disabled={disabled} />}
      {service.name === 'A2A' && <EndpointFields service={service} onUpdate={onUpdate} disabled={disabled} placeholder="https://api.example.com/a2a" />}
      {service.name === 'OASF' && <OASFFields service={service} onUpdate={onUpdate} disabled={disabled} />}
      {service.name === 'ENS' && <IdentityField service={service} onUpdate={onUpdate} disabled={disabled} placeholder="myagent.eth" />}
      {service.name === 'DID' && <IdentityField service={service} onUpdate={onUpdate} disabled={disabled} placeholder="did:web:example.com" />}
      {service.name === 'agentWallet' && <IdentityField service={service} onUpdate={onUpdate} disabled={disabled} placeholder="eip155:1:0xAbC..." />}
    </div>
  )
}

// ─── Protocol-specific field components ──────────────────

const inputClass = `w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg
  bg-white dark:bg-[#1a1a1a] text-[#0a0a0a] dark:text-[#fafafa]
  focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] dark:focus:ring-[#fafafa]
  disabled:bg-[#f5f5f5] dark:disabled:bg-[#262626] disabled:cursor-not-allowed
  placeholder:text-[#a3a3a3]`

function MCPFields({ service, onUpdate, disabled }: { service: Extract<ServiceInput, { name: 'MCP' }>; onUpdate: (s: ServiceInput) => void; disabled: boolean }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1">
          Endpoint URL <span className="text-red-500">*</span>
        </label>
        <input type="url" value={service.endpoint} onChange={(e) => onUpdate({ ...service, endpoint: e.target.value })} placeholder="https://api.example.com/mcp" disabled={disabled} className={inputClass} />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1">Version</label>
          <input type="text" value={service.version} onChange={(e) => onUpdate({ ...service, version: e.target.value })} disabled={disabled} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1">
          Tools <span className="font-normal text-[#a3a3a3] ml-1">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={service.mcpTools.join(', ')}
          onChange={(e) => onUpdate({ ...service, mcpTools: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
          placeholder="search, generate, translate"
          disabled={disabled}
          className={inputClass}
        />
      </div>
    </div>
  )
}

function EndpointFields({ service, onUpdate, disabled, placeholder }: { service: Extract<ServiceInput, { name: 'A2A' }>; onUpdate: (s: ServiceInput) => void; disabled: boolean; placeholder: string }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1">
          Endpoint URL <span className="text-red-500">*</span>
        </label>
        <input type="url" value={service.endpoint} onChange={(e) => onUpdate({ ...service, endpoint: e.target.value })} placeholder={placeholder} disabled={disabled} className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1">Version</label>
        <input type="text" value={service.version} onChange={(e) => onUpdate({ ...service, version: e.target.value })} disabled={disabled} className={inputClass} />
      </div>
    </div>
  )
}

function OASFFields({ service, onUpdate, disabled }: { service: Extract<ServiceInput, { name: 'OASF' }>; onUpdate: (s: ServiceInput) => void; disabled: boolean }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1">
          Skills <span className="font-normal text-[#a3a3a3] ml-1">(select at least 1 skill or domain)</span>
        </label>
        <TaxonomySelector
          type="skills"
          selected={service.skills}
          onChange={(skills) => onUpdate({ ...service, skills })}
          maxItems={5}
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1">Domains</label>
        <TaxonomySelector
          type="domains"
          selected={service.domains}
          onChange={(domains) => onUpdate({ ...service, domains })}
          maxItems={5}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

function IdentityField({ service, onUpdate, disabled, placeholder }: { service: ServiceInput; onUpdate: (s: ServiceInput) => void; disabled: boolean; placeholder: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1">
        Identifier <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={service.endpoint}
        onChange={(e) => onUpdate({ ...service, endpoint: e.target.value })}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClass}
      />
    </div>
  )
}

// ─── Add Service dropdown menu ───────────────────────────

function AddServiceMenu({ availableTypes, onSelect, onClose }: { availableTypes: ServiceType[]; onSelect: (t: ServiceType) => void; onClose: () => void }) {
  const descriptions: Record<ServiceType, string> = {
    MCP: 'Model Context Protocol endpoint',
    A2A: 'Agent-to-Agent protocol endpoint',
    OASF: 'Skills & domains taxonomy',
    ENS: 'ENS name identity',
    DID: 'Decentralized Identifier',
    agentWallet: 'Agent-controlled wallet (eip155)',
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] rounded-lg shadow-lg overflow-hidden">
        {availableTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="w-full px-4 py-3 text-left hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors flex items-center gap-3"
          >
            <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${PROTOCOL_META[type].color}`}>
              {PROTOCOL_META[type].label}
            </span>
            <span className="text-sm text-[#6e6e73] dark:text-[#86868b]">{descriptions[type]}</span>
          </button>
        ))}
      </div>
    </>
  )
}
