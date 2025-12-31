'use client'

/**
 * EndpointEditor - Dynamic list of endpoint configurations
 *
 * Each endpoint contains:
 * - URL (required)
 * - Skills (optional, multi-select)
 * - Domains (optional, multi-select)
 */

import { TaxonomySelector } from './TaxonomySelector'

export interface EndpointInput {
  url: string
  skills: string[]
  domains: string[]
}

interface EndpointEditorProps {
  endpoints: EndpointInput[]
  onChange: (endpoints: EndpointInput[]) => void
  disabled?: boolean
}

const emptyEndpoint: EndpointInput = {
  url: '',
  skills: [],
  domains: [],
}

export function EndpointEditor({ endpoints, onChange, disabled = false }: EndpointEditorProps) {
  const addEndpoint = () => {
    onChange([...endpoints, { ...emptyEndpoint }])
  }

  const removeEndpoint = (index: number) => {
    onChange(endpoints.filter((_, i) => i !== index))
  }

  const updateEndpoint = (index: number, field: keyof EndpointInput, value: string | string[]) => {
    const updated = [...endpoints]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      {endpoints.map((endpoint, index) => (
        <div
          key={index}
          className="p-4 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a]"
        >
          {/* Header with remove button */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa]">
              Endpoint {index + 1}
            </span>
            {endpoints.length > 1 && !disabled && (
              <button
                type="button"
                onClick={() => removeEndpoint(index)}
                className="text-sm text-red-500 hover:text-red-600 transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          {/* URL input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1">
              URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={endpoint.url}
              onChange={(e) => updateEndpoint(index, 'url', e.target.value)}
              placeholder="https://api.example.com/v1"
              disabled={disabled}
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg
                       bg-white dark:bg-[#1a1a1a] text-[#0a0a0a] dark:text-[#fafafa]
                       focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] dark:focus:ring-[#fafafa]
                       disabled:bg-[#f5f5f5] dark:disabled:bg-[#262626] disabled:cursor-not-allowed
                       placeholder:text-[#a3a3a3]"
            />
          </div>

          {/* Skills selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1">
              Skills
              <span className="font-normal text-[#a3a3a3] ml-1">(optional)</span>
            </label>
            <TaxonomySelector
              type="skills"
              selected={endpoint.skills}
              onChange={(skills) => updateEndpoint(index, 'skills', skills)}
              maxItems={5}
              disabled={disabled}
            />
          </div>

          {/* Domains selector */}
          <div>
            <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1">
              Domains
              <span className="font-normal text-[#a3a3a3] ml-1">(optional)</span>
            </label>
            <TaxonomySelector
              type="domains"
              selected={endpoint.domains}
              onChange={(domains) => updateEndpoint(index, 'domains', domains)}
              maxItems={5}
              disabled={disabled}
            />
          </div>
        </div>
      ))}

      {/* Add endpoint button */}
      {!disabled && (
        <button
          type="button"
          onClick={addEndpoint}
          className="w-full py-2 text-sm font-medium text-[#6e6e73] dark:text-[#86868b]
                   border border-dashed border-[#d4d4d4] dark:border-[#525252] rounded-lg
                   hover:border-[#0a0a0a] dark:hover:border-[#fafafa]
                   hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors
                   flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Endpoint
        </button>
      )}
    </div>
  )
}
