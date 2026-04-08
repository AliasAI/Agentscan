'use client'

import { useState, useEffect, useCallback } from 'react'

const tabs = [
  {
    label: 'Claude Code',
    code: `claude mcp add agentscan -- npx -y @aliasai2026/agentscan-mcp-server`,
  },
  {
    label: 'Claude Desktop',
    code: `{
  "mcpServers": {
    "agentscan": {
      "command": "npx",
      "args": ["-y", "@aliasai2026/agentscan-mcp-server"]
    }
  }
}`,
  },
  {
    label: 'Cursor / VS Code',
    code: `{
  "mcpServers": {
    "agentscan": {
      "command": "npx",
      "args": ["-y", "@aliasai2026/agentscan-mcp-server"]
    }
  }
}`,
  },
]

export function McpInstallModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(tabs[activeTab].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [activeTab])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-4 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-[#a3a3a3] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-[#0a0a0a] dark:text-[#fafafa]">
            Connect AI Assistants to AgentScan
          </h2>
          <p className="text-sm text-[#525252] dark:text-[#a3a3a3] mt-1.5 leading-relaxed">
            Install the MCP server to query on-chain AI agents directly from your AI assistant.
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-4 border-b border-[#e5e5e5] dark:border-[#262626]">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => { setActiveTab(i); setCopied(false) }}
                className={`pb-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === i
                    ? 'border-[#0a0a0a] dark:border-[#fafafa] text-[#0a0a0a] dark:text-[#fafafa]'
                    : 'border-transparent text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code block */}
        <div className="px-6 py-4">
          <div className="relative rounded-lg bg-[#f5f5f5] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-md text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] hover:bg-[#e5e5e5] dark:hover:bg-[#262626] transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </button>

            <pre className="p-4 pr-12 text-[13px] leading-relaxed font-mono text-[#0a0a0a] dark:text-[#e5e5e5] overflow-x-auto whitespace-pre-wrap break-all">
              {tabs[activeTab].code}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <a
            href="https://www.npmjs.com/package/@aliasai2026/agentscan-mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors"
          >
            22 tools available &mdash; View on npm &rarr;
          </a>
        </div>
      </div>
    </div>
  )
}
