/**
 * WriteReviewModal - Submit feedback/review for an agent
 *
 * Based on ERC-8004 Jan 2026 spec: No agent signature required,
 * any wallet can submit reviews directly to Reputation Registry.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Modal } from '@/components/common/Modal'
import { StarRating } from '@/components/common/StarRating'
import { TransactionStatus, type TxStatus } from '@/components/web3/TransactionStatus'
import { REPUTATION_REGISTRY_ABI, getReputationContract } from '@/lib/web3/contracts'
import { uploadFeedbackToIPFS, buildFeedbackMetadata } from '@/lib/ipfs/upload'

// ERC-8004 standardized feedback tags (Best Practices Jan 2026)
// Reference: https://github.com/erc-8004/best-practices/blob/main/Reputation.md
const FEEDBACK_TAGS = [
  { value: 'starred', label: 'Starred (Quality Rating)' },
  { value: 'reachable', label: 'Reachable (Availability)' },
  { value: 'ownerVerified', label: 'Owner Verified' },
  { value: 'uptime', label: 'Uptime (%)' },
  { value: 'successRate', label: 'Success Rate (%)' },
  { value: 'responseTime', label: 'Response Time (ms)' },
  { value: 'blocktimeFreshness', label: 'Blocktime Freshness' },
  { value: 'revenues', label: 'Revenues ($)' },
  { value: 'tradingYield', label: 'Trading Yield (%)' },
]

// Score mapping: 5 stars -> 0-100
const STAR_TO_SCORE: Record<number, number> = {
  1: 20,
  2: 40,
  3: 60,
  4: 80,
  5: 100,
}

interface WriteReviewModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: number          // Token ID on-chain
  agentName: string        // For display
  onSuccess?: () => void   // Callback after successful submission
}

export function WriteReviewModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  onSuccess,
}: WriteReviewModalProps) {
  // Form state
  const [starRating, setStarRating] = useState(0)
  const [tag1, setTag1] = useState('')
  const [tag2, setTag2] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [endpoint, setEndpoint] = useState('')

  // Transaction state
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Track who initiated the transaction
  const txInitiatorRef = useRef<string | null>(null)

  // Wagmi hooks
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const {
    writeContract,
    data: txHash,
    isPending,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Get contract address for current chain
  const contractAddress = chainId ? getReputationContract(chainId) : undefined
  const isWrongNetwork = chainId !== 11155111 // Only Sepolia supported for now

  // Update transaction status based on wagmi state
  useEffect(() => {
    if (isPending) {
      setTxStatus('pending')
    } else if (isConfirming) {
      setTxStatus('confirming')
    } else if (isConfirmed) {
      setTxStatus('success')
      // Trigger callback after short delay
      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } else if (isWriteError || confirmError) {
      setTxStatus('error')
      const err = writeError || confirmError
      if (err) {
        // Check for user rejection
        if (err.message?.includes('User rejected') || err.message?.includes('user rejected')) {
          setErrorMessage('Transaction cancelled by user')
        } else {
          setErrorMessage(err.message || 'Transaction failed')
        }
      }
    }
  }, [isPending, isConfirming, isConfirmed, isWriteError, confirmError, writeError, onSuccess])

  // Reset state when address changes during pending transaction
  useEffect(() => {
    if (txInitiatorRef.current && address !== txInitiatorRef.current) {
      handleReset()
    }
  }, [address])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setStarRating(0)
    setTag1('')
    setTag2('')
    setReviewText('')
    setEndpoint('')
    setTxStatus('idle')
    setErrorMessage('')
    txInitiatorRef.current = null
    resetWrite()
  }

  const handleReset = () => {
    setTxStatus('idle')
    setErrorMessage('')
    txInitiatorRef.current = null
    resetWrite()
  }

  const handleSubmit = async () => {
    if (!address || !contractAddress) return
    if (starRating === 0 || !tag1) return

    try {
      // Record who initiated this transaction
      txInitiatorRef.current = address

      const score = STAR_TO_SCORE[starRating]
      let feedbackUri = ''
      let feedbackHash: `0x${string}` = '0x0000000000000000000000000000000000000000000000000000000000000000'

      // Upload to IPFS if there's review text
      if (reviewText.trim()) {
        setTxStatus('uploading')
        const metadata = buildFeedbackMetadata(
          agentId,
          score,
          tag1,
          tag2 || '',
          endpoint || '',
          address,
          reviewText
        )
        const result = await uploadFeedbackToIPFS(metadata)
        feedbackUri = result.uri
        feedbackHash = result.hash
      }

      // Call contract
      setTxStatus('pending')
      writeContract({
        address: contractAddress,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'giveFeedback',
        args: [
          BigInt(agentId),
          score,
          tag1,
          tag2 || '',
          endpoint || '',
          feedbackUri,
          feedbackHash,
        ],
      })
    } catch (err) {
      setTxStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit review')
    }
  }

  const handleClose = () => {
    // Don't close during pending transaction
    if (txStatus === 'pending' || txStatus === 'confirming') {
      return
    }
    onClose()
    // Delay reset to avoid flicker
    setTimeout(resetForm, 300)
  }

  const isFormValid = starRating > 0 && tag1 !== ''
  const isSubmitting = txStatus === 'uploading' || txStatus === 'pending' || txStatus === 'confirming'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Write Review" size="md">
      <div className="space-y-6">
        {/* Agent name display */}
        <div className="text-sm text-[#737373] dark:text-[#a3a3a3]">
          Reviewing: <span className="font-medium text-[#0a0a0a] dark:text-[#fafafa]">{agentName}</span>
        </div>

        {/* Wallet connection check */}
        {!isConnected && (
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Please connect your wallet to submit a review.
            </p>
          </div>
        )}

        {/* Wrong network warning */}
        {isConnected && isWrongNetwork && (
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Please switch to Sepolia network to submit reviews.
            </p>
          </div>
        )}

        {/* Form */}
        {isConnected && !isWrongNetwork && txStatus !== 'success' && (
          <>
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <StarRating
                value={starRating}
                onChange={setStarRating}
                size="lg"
              />
              {starRating > 0 && (
                <p className="text-sm text-[#737373] dark:text-[#a3a3a3] mt-1">
                  {starRating} star{starRating > 1 ? 's' : ''} ({STAR_TO_SCORE[starRating]} points)
                </p>
              )}
            </div>

            {/* Primary Tag */}
            <div>
              <label className="block text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-2">
                Primary Tag <span className="text-red-500">*</span>
              </label>
              <select
                value={tag1}
                onChange={(e) => setTag1(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg border border-[#e5e5e5] dark:border-[#404040]
                  bg-white dark:bg-[#1a1a1a] text-[#0a0a0a] dark:text-[#fafafa]
                  focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select a tag...</option>
                {FEEDBACK_TAGS.map((tag) => (
                  <option key={tag.value} value={tag.value}>
                    {tag.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Tag (optional) */}
            <div>
              <label className="block text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-2">
                Secondary Tag <span className="text-[#737373] dark:text-[#a3a3a3] font-normal">(optional)</span>
              </label>
              <select
                value={tag2}
                onChange={(e) => setTag2(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg border border-[#e5e5e5] dark:border-[#404040]
                  bg-white dark:bg-[#1a1a1a] text-[#0a0a0a] dark:text-[#fafafa]
                  focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">None</option>
                {FEEDBACK_TAGS.filter((t) => t.value !== tag1).map((tag) => (
                  <option key={tag.value} value={tag.value}>
                    {tag.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Review Text (optional) */}
            <div>
              <label className="block text-sm font-medium text-[#0a0a0a] dark:text-[#fafafa] mb-2">
                Review <span className="text-[#737373] dark:text-[#a3a3a3] font-normal">(optional)</span>
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                disabled={isSubmitting}
                placeholder="Share your experience with this agent..."
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 rounded-lg border border-[#e5e5e5] dark:border-[#404040]
                  bg-white dark:bg-[#1a1a1a] text-[#0a0a0a] dark:text-[#fafafa]
                  placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252]
                  focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50
                  resize-none"
              />
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-1">
                {reviewText.length}/1000 characters
                {reviewText.trim() && ' (will be stored on IPFS)'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors
                bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a]
                hover:bg-[#262626] dark:hover:bg-[#e5e5e5]
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </>
        )}

        {/* Transaction Status */}
        <TransactionStatus
          status={txStatus}
          txHash={txHash}
          chainId={chainId}
          error={errorMessage}
          onReset={handleReset}
          onCancel={handleReset}
          successTitle="Review submitted!"
          successDescription="Your review has been recorded on-chain"
        />

        {/* Success message */}
        {txStatus === 'success' && (
          <div className="text-center">
            <p className="text-sm text-[#737373] dark:text-[#a3a3a3] mb-4">
              Your review has been submitted successfully!
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-lg font-medium transition-colors
                bg-[#0a0a0a] dark:bg-[#fafafa] text-white dark:text-[#0a0a0a]
                hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default WriteReviewModal
