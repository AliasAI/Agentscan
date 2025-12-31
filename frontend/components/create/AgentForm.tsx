'use client'

/**
 * AgentForm - Main form for creating ERC-8004 agents
 *
 * Integrates:
 * - Basic info (name, description)
 * - Endpoints with OASF taxonomy
 * - Metadata preview
 * - IPFS upload
 * - Contract interaction
 * - Wallet change detection (resets tx state on account change)
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { EndpointEditor, type EndpointInput } from './EndpointEditor'
import { MetadataPreview } from './MetadataPreview'
import { TransactionStatus, type TxStatus } from '../web3/TransactionStatus'
import { NetworkWarning } from '../web3/NetworkSwitcher'
import { uploadToIPFS, buildMetadata, validateMetadata } from '@/lib/ipfs/upload'
import { IDENTITY_REGISTRY_ABI, getIdentityContract } from '@/lib/web3/contracts'
import { isSupportedChain, chainNames } from '@/lib/web3/config'

const defaultEndpoint: EndpointInput = {
  url: '',
  skills: [],
  domains: [],
}

export function AgentForm() {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [endpoints, setEndpoints] = useState<EndpointInput[]>([{ ...defaultEndpoint }])

  // Transaction state
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [txError, setTxError] = useState<string>('')
  const [ipfsUri, setIpfsUri] = useState<string>('')

  // Track the address that initiated the transaction
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

  // Detect wallet/account change during pending transaction
  useEffect(() => {
    // If we have a pending transaction and the address changed
    if (txInitiatorRef.current && address !== txInitiatorRef.current) {
      // Reset everything - the old tx is no longer valid for this account
      resetWrite()
      setTxStatus('idle')
      setTxError('')
      setIpfsUri('')
      txInitiatorRef.current = undefined
    }
  }, [address, resetWrite])

  // Handle wallet rejection or write errors (e.g., user clicked "Cancel" in MetaMask)
  useEffect(() => {
    if (isWriteError && writeError && txStatus === 'pending') {
      // Check if user rejected the transaction
      const errorMessage = writeError.message || 'Transaction failed'
      const isUserRejection =
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('ACTION_REJECTED')

      if (isUserRejection) {
        // User cancelled in wallet - just reset to idle (no error message needed)
        resetWrite()
        setTxStatus('idle')
        txInitiatorRef.current = undefined
      } else {
        // Actual error - show error state
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
    txInitiatorRef.current = undefined // Clear initiator on success
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setTxError('')

      // Build and validate metadata
      const metadata = buildMetadata(name, description, endpoints)
      const validationError = validateMetadata(metadata)
      if (validationError) {
        setTxError(validationError)
        setTxStatus('error')
        return
      }

      // Check network
      const contractAddress = getIdentityContract(chainId)
      if (!contractAddress) {
        setTxError(`Network ${chainNames[chainId] || chainId} is not supported`)
        setTxStatus('error')
        return
      }

      try {
        // Upload to IPFS
        setTxStatus('uploading')
        const uri = await uploadToIPFS(metadata)
        setIpfsUri(uri)

        // Record who is initiating this transaction
        txInitiatorRef.current = address

        // Call contract
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
    [name, description, endpoints, chainId, writeContract, address]
  )

  const resetForm = () => {
    resetWrite()
    setTxStatus('idle')
    setTxError('')
    setIpfsUri('')
    txInitiatorRef.current = undefined
  }

  // Cancel pending transaction (user can manually reset)
  const cancelTransaction = () => {
    resetForm()
  }

  const isFormDisabled = !isConnected || !isSupportedChain(chainId) || txStatus !== 'idle'
  const isSubmitDisabled =
    isFormDisabled ||
    !name.trim() ||
    !description.trim() ||
    endpoints.every((e) => !e.url.trim())

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Network warning */}
      <NetworkWarning />

      {/* Transaction status */}
      <TransactionStatus
        status={txStatus}
        txHash={txHash}
        chainId={chainId}
        error={txError}
        onReset={resetForm}
        onCancel={cancelTransaction}
      />

      {/* Success message with navigation */}
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
              setEndpoints([{ ...defaultEndpoint }])
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

          {/* Endpoints */}
          <div>
            <label className="block text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-2">
              Endpoints <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-[#6e6e73] dark:text-[#86868b] mb-3">
              Add API endpoints where your agent can be accessed. Include OASF skills and domains
              for better discoverability.
            </p>
            <EndpointEditor
              endpoints={endpoints}
              onChange={setEndpoints}
              disabled={isFormDisabled}
            />
          </div>

          {/* Metadata preview */}
          <div>
            <label className="block text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-2">
              Preview
            </label>
            <MetadataPreview name={name} description={description} endpoints={endpoints} />
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
