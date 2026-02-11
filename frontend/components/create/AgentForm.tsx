'use client'

/**
 * AgentForm - Main form for creating ERC-8004 agents
 *
 * Integrates:
 * - Basic info (name, description, image)
 * - Services with protocol-specific editors
 * - Options (active, x402Support)
 * - Metadata preview
 * - IPFS upload + on-chain registration
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ServiceEditor } from './ServiceEditor'
import { MetadataPreview } from './MetadataPreview'
import { TransactionStatus, type TxStatus } from '../web3/TransactionStatus'
import { NetworkWarning } from '../web3/NetworkSwitcher'
import { uploadToIPFS, buildMetadata, validateMetadata } from '@/lib/ipfs/upload'
import { IDENTITY_REGISTRY_ABI, getIdentityContract } from '@/lib/web3/contracts'
import { isSupportedChain, chainNames } from '@/lib/web3/config'
import type { ServiceInput, CreateAgentForm as FormState } from '@/types'

export function AgentForm() {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [services, setServices] = useState<ServiceInput[]>([])
  const [active, setActive] = useState(true)
  const [x402Support, setX402Support] = useState(false)

  // Transaction state
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [txError, setTxError] = useState<string>('')
  const [ipfsUri, setIpfsUri] = useState<string>('')
  const txInitiatorRef = useRef<string | undefined>(undefined)

  // Contract interaction
  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Memoize form object for MetadataPreview
  const form = useMemo<FormState>(
    () => ({ name, description, image, services, active, x402Support }),
    [name, description, image, services, active, x402Support]
  )

  // Detect wallet/account change during pending transaction
  useEffect(() => {
    if (txInitiatorRef.current && address !== txInitiatorRef.current) {
      resetWrite()
      setTxStatus('idle')
      setTxError('')
      setIpfsUri('')
      txInitiatorRef.current = undefined
    }
  }, [address, resetWrite])

  // Handle wallet rejection or write errors
  useEffect(() => {
    if (isWriteError && writeError && txStatus === 'pending') {
      const errorMessage = writeError.message || 'Transaction failed'
      const isUserRejection =
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('ACTION_REJECTED')

      if (isUserRejection) {
        resetWrite()
        setTxStatus('idle')
        txInitiatorRef.current = undefined
      } else {
        setTxError(errorMessage)
        setTxStatus('error')
        txInitiatorRef.current = undefined
      }
    }
  }, [isWriteError, writeError, txStatus, resetWrite])

  // Update status based on transaction state
  if (isWritePending && txStatus === 'uploading') {
    setTxStatus('pending')
  }
  if (isConfirming && txStatus === 'pending') {
    setTxStatus('confirming')
  }
  if (isConfirmed && txStatus === 'confirming') {
    setTxStatus('success')
    txInitiatorRef.current = undefined
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setTxError('')

      const metadata = buildMetadata(form)
      const validationError = validateMetadata(metadata)
      if (validationError) {
        setTxError(validationError)
        setTxStatus('error')
        return
      }

      const contractAddress = getIdentityContract(chainId)
      if (!contractAddress) {
        setTxError(`Network ${chainNames[chainId] || chainId} is not supported`)
        setTxStatus('error')
        return
      }

      try {
        setTxStatus('uploading')
        const uri = await uploadToIPFS(metadata)
        setIpfsUri(uri)

        txInitiatorRef.current = address

        setTxStatus('pending')
        writeContract({
          address: contractAddress,
          abi: IDENTITY_REGISTRY_ABI,
          functionName: 'register',
          args: [uri],
        })
      } catch (err) {
        console.error('Error creating agent:', err)
        setTxError(err instanceof Error ? err.message : 'Unknown error')
        setTxStatus('error')
        txInitiatorRef.current = undefined
      }
    },
    [form, chainId, writeContract, address]
  )

  const resetForm = () => {
    resetWrite()
    setTxStatus('idle')
    setTxError('')
    setIpfsUri('')
    txInitiatorRef.current = undefined
  }

  const isFormDisabled = !isConnected || !isSupportedChain(chainId) || txStatus !== 'idle'
  const isSubmitDisabled = isFormDisabled || !name.trim() || !description.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <NetworkWarning />

      <TransactionStatus
        status={txStatus}
        txHash={txHash}
        chainId={chainId}
        error={txError}
        onReset={resetForm}
        onCancel={resetForm}
      />

      {/* Success actions */}
      {txStatus === 'success' && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/agents')}
            className="flex-1 py-2 text-sm font-medium bg-[#0a0a0a] dark:bg-[#fafafa]
                     text-white dark:text-[#0a0a0a] rounded-lg hover:opacity-90"
          >
            View All Agents
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm()
              setName('')
              setDescription('')
              setImage('')
              setServices([])
              setActive(true)
              setX402Support(false)
            }}
            className="flex-1 py-2 text-sm font-medium border border-[#e5e5e5] dark:border-[#333]
                     rounded-lg hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a]"
          >
            Create Another
          </button>
        </div>
      )}

      {/* Form fields */}
      {txStatus !== 'success' && (
        <>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My AI Agent"
              maxLength={100}
              disabled={isFormDisabled}
              className="w-full px-4 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg
                       bg-white dark:bg-[#0a0a0a] text-[#0a0a0a] dark:text-[#fafafa]
                       focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] dark:focus:ring-[#fafafa]
                       disabled:bg-[#f5f5f5] dark:disabled:bg-[#1a1a1a] disabled:cursor-not-allowed
                       placeholder:text-[#a3a3a3]"
            />
            <p className="mt-1 text-xs text-[#6e6e73] dark:text-[#86868b]">
              {name.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your agent does, its capabilities, and use cases..."
              rows={4}
              disabled={isFormDisabled}
              className="w-full px-4 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg
                       bg-white dark:bg-[#0a0a0a] text-[#0a0a0a] dark:text-[#fafafa]
                       focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] dark:focus:ring-[#fafafa]
                       disabled:bg-[#f5f5f5] dark:disabled:bg-[#1a1a1a] disabled:cursor-not-allowed
                       placeholder:text-[#a3a3a3] resize-none"
            />
            <p className="mt-1 text-xs text-[#6e6e73] dark:text-[#86868b]">
              Minimum 20 characters ({description.length} entered)
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-1">
              Image URL
              <span className="font-normal text-[#a3a3a3] text-xs ml-2">(optional)</span>
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/avatar.png or ipfs://..."
              disabled={isFormDisabled}
              className="w-full px-4 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg
                       bg-white dark:bg-[#0a0a0a] text-[#0a0a0a] dark:text-[#fafafa]
                       focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] dark:focus:ring-[#fafafa]
                       disabled:bg-[#f5f5f5] dark:disabled:bg-[#1a1a1a] disabled:cursor-not-allowed
                       placeholder:text-[#a3a3a3]"
            />
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-2">
              Services
              <span className="font-normal text-[#a3a3a3] text-xs ml-2">(optional)</span>
            </label>
            <p className="text-xs text-[#6e6e73] dark:text-[#86868b] mb-3">
              Add protocol services your agent supports. You can register with just a name and description, then add services later.
            </p>
            <ServiceEditor
              services={services}
              onChange={setServices}
              disabled={isFormDisabled}
            />
          </div>

          {/* Options row */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                disabled={isFormDisabled}
                className="w-4 h-4 rounded border-[#d4d4d4] text-[#0a0a0a] focus:ring-[#0a0a0a]
                         dark:border-[#525252] dark:bg-[#1a1a1a]"
              />
              <span className="text-sm text-[#0a0a0a] dark:text-[#fafafa]">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={x402Support}
                onChange={(e) => setX402Support(e.target.checked)}
                disabled={isFormDisabled}
                className="w-4 h-4 rounded border-[#d4d4d4] text-[#0a0a0a] focus:ring-[#0a0a0a]
                         dark:border-[#525252] dark:bg-[#1a1a1a]"
              />
              <span className="text-sm text-[#0a0a0a] dark:text-[#fafafa]">x402 Payment Support</span>
            </label>
          </div>

          {/* Metadata preview */}
          <div>
            <label className="block text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-2">
              Preview
            </label>
            <MetadataPreview form={form} />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full py-3 text-sm font-medium bg-[#0a0a0a] dark:bg-[#fafafa]
                     text-white dark:text-[#0a0a0a] rounded-lg
                     hover:opacity-90 transition-opacity
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isConnected
              ? 'Connect Wallet to Create'
              : !isSupportedChain(chainId)
              ? 'Switch to Supported Network'
              : 'Create Agent'}
          </button>

          {/* IPFS URI display */}
          {ipfsUri && (
            <p className="text-xs text-center text-[#6e6e73] dark:text-[#86868b]">
              Metadata: {ipfsUri}
            </p>
          )}
        </>
      )}
    </form>
  )
}
