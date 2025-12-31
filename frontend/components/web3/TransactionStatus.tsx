'use client'

/**
 * TransactionStatus - Display transaction progress
 *
 * States: idle, uploading, pending, confirming, success, error
 */

import { getTransactionUrl } from '@/lib/web3/contracts'

export type TxStatus = 'idle' | 'uploading' | 'pending' | 'confirming' | 'success' | 'error'

interface TransactionStatusProps {
  status: TxStatus
  txHash?: string
  chainId?: number
  error?: string
  onReset?: () => void
  onCancel?: () => void // Allow user to cancel pending transaction
}

export function TransactionStatus({
  status,
  txHash,
  chainId,
  error,
  onReset,
  onCancel,
}: TransactionStatusProps) {
  if (status === 'idle') return null

  const txUrl = txHash && chainId ? getTransactionUrl(chainId, txHash) : null

  return (
    <div
      className={`p-4 rounded-lg border ${
        status === 'error'
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : status === 'success'
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          {status === 'uploading' && (
            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {(status === 'pending' || status === 'confirming') && (
            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {status === 'success' && (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {status === 'error' && (
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Status content */}
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-medium ${
              status === 'error'
                ? 'text-red-800 dark:text-red-200'
                : status === 'success'
                ? 'text-green-800 dark:text-green-200'
                : 'text-blue-800 dark:text-blue-200'
            }`}
          >
            {status === 'uploading' && 'Uploading to IPFS...'}
            {status === 'pending' && 'Waiting for wallet...'}
            {status === 'confirming' && 'Confirming transaction...'}
            {status === 'success' && 'Agent created successfully!'}
            {status === 'error' && 'Transaction failed'}
          </h4>

          <p
            className={`text-sm mt-1 ${
              status === 'error'
                ? 'text-red-700 dark:text-red-300'
                : status === 'success'
                ? 'text-green-700 dark:text-green-300'
                : 'text-blue-700 dark:text-blue-300'
            }`}
          >
            {status === 'uploading' && 'Please wait while metadata is being uploaded...'}
            {status === 'pending' && 'Please confirm the transaction in your wallet'}
            {status === 'confirming' && 'Transaction submitted, waiting for confirmation...'}
            {status === 'success' && 'Your agent has been registered on-chain'}
            {status === 'error' && (error || 'An error occurred')}
          </p>

          {/* Transaction link */}
          {txUrl && (
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm mt-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              View transaction
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* Reset button for error state */}
        {status === 'error' && onReset && (
          <button
            onClick={onReset}
            className="flex-shrink-0 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        )}

        {/* Cancel button for pending states */}
        {(status === 'uploading' || status === 'pending' || status === 'confirming') && onCancel && (
          <button
            onClick={onCancel}
            className="flex-shrink-0 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
