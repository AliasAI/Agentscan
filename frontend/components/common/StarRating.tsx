/**
 * StarRating - Reusable star rating component
 *
 * Supports both read-only display and interactive selection modes
 */

'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number                    // Current rating (1-5)
  onChange?: (value: number) => void  // Callback when rating changes (makes it interactive)
  size?: 'sm' | 'md' | 'lg'       // Star size
  readonly?: boolean               // Force read-only mode
  showLabel?: boolean              // Show numeric label (e.g., "4.0")
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export function StarRating({
  value,
  onChange,
  size = 'md',
  readonly = false,
  showLabel = false,
  className = '',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const isInteractive = !readonly && !!onChange
  const displayValue = hoverValue ?? value

  const handleClick = (star: number) => {
    if (isInteractive && onChange) {
      onChange(star)
    }
  }

  const handleMouseEnter = (star: number) => {
    if (isInteractive) {
      setHoverValue(star)
    }
  }

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoverValue(null)
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            className={`
              ${isInteractive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
              transition-transform duration-100 p-0.5
              focus:outline-none focus:ring-0
              disabled:cursor-default
            `}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <StarIcon
              filled={star <= displayValue}
              className={SIZE_CLASSES[size]}
            />
          </button>
        ))}
      </div>
      {showLabel && (
        <span className="ml-1 text-sm text-[#737373] dark:text-[#a3a3a3]">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Star SVG icon component
function StarIcon({ filled, className }: { filled: boolean; className: string }) {
  if (filled) {
    return (
      <svg
        className={`${className} text-[#f59e0b]`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    )
  }

  return (
    <svg
      className={`${className} text-[#d4d4d4] dark:text-[#525252]`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  )
}

export default StarRating
