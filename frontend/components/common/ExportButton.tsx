'use client'

import { useState } from 'react'
import { useToast } from './Toast'

interface ExportButtonProps {
  data: any[]
  filename: string
  formatData?: (data: any[]) => any[]
  variant?: 'primary' | 'secondary'
}

export function ExportButton({
  data,
  filename,
  formatData,
  variant = 'secondary'
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const toast = useToast()

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const formattedData = formatData ? formatData(data) : data

      if (format === 'json') {
        const { downloadAsJSON } = await import('@/lib/utils/export')
        downloadAsJSON(formattedData, filename)
        toast.success('Data exported as JSON successfully!')
      } else {
        const { downloadAsCSV } = await import('@/lib/utils/export')
        downloadAsCSV(formattedData, filename)
        toast.success('Data exported as CSV successfully!')
      }
      setIsOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export data')
    }
  }

  const buttonClasses = variant === 'primary'
    ? 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
    : 'px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm hover:bg-gray-50 dark:hover:bg-gray-800'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${buttonClasses} focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 transition-colors`}
        disabled={!data || data.length === 0}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 right-0 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-20 overflow-hidden">
            <button
              onClick={() => handleExport('json')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export as JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as CSV
            </button>
          </div>
        </>
      )}
    </div>
  )
}
