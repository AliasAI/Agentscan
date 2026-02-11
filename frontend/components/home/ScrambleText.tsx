'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*'

interface ScrambleTextProps {
  text: string
  className?: string
  /** Milliseconds between each frame of scrambling (default: 30) */
  scrambleSpeed?: number
  /** How many frames before each character resolves (default: 3) */
  revealDelay?: number
  /** Whether to trigger on mount as well (default: true) */
  triggerOnMount?: boolean
}

export function ScrambleText({
  text,
  className = '',
  scrambleSpeed = 30,
  revealDelay = 3,
  triggerOnMount = true,
}: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isAnimatingRef = useRef(false)

  const scramble = useCallback(() => {
    if (isAnimatingRef.current) return
    isAnimatingRef.current = true

    let resolvedCount = 0
    let frameCount = 0

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      frameCount++

      // Every `revealDelay` frames, lock in one more character
      if (frameCount % revealDelay === 0) {
        resolvedCount++
      }

      // Build display string: resolved chars + scrambled chars
      const result = text
        .split('')
        .map((char, i) => {
          if (i < resolvedCount) return char
          // Preserve spaces and special characters
          if (char === ' ') return ' '
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')

      setDisplayText(result)

      // All characters resolved — stop
      if (resolvedCount >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        isAnimatingRef.current = false
        setDisplayText(text)
      }
    }, scrambleSpeed)
  }, [text, scrambleSpeed, revealDelay])

  // Trigger on mount
  useEffect(() => {
    if (triggerOnMount) {
      scramble()
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [scramble, triggerOnMount])

  // Update if text prop changes
  useEffect(() => {
    setDisplayText(text)
  }, [text])

  return (
    <span
      className={className}
      onMouseEnter={scramble}
      style={{ cursor: 'default' }}
    >
      {displayText}
    </span>
  )
}
