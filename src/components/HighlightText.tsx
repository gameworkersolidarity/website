'use client'

import React from 'react'

/**
 * Highlights text using character ranges from Fuse.js matches.
 * This provides more accurate highlighting than regex-based approaches.
 */
export function HighlightText({
  text,
  ranges,
}: {
  text: string
  ranges?: Array<[number, number]>
}) {
  if (!ranges || ranges.length === 0) {
    return <>{text}</>
  }

  // Sort ranges by start position
  const sortedRanges = [...ranges].sort((a, b) => a[0] - b[0])

  // Merge overlapping ranges
  const mergedRanges: Array<[number, number]> = []
  for (const [start, end] of sortedRanges) {
    if (mergedRanges.length === 0) {
      mergedRanges.push([start, end])
    } else {
      const lastRange = mergedRanges[mergedRanges.length - 1]
      if (start <= lastRange[1]) {
        // Overlapping or adjacent ranges - merge them
        lastRange[1] = Math.max(lastRange[1], end)
      } else {
        mergedRanges.push([start, end])
      }
    }
  }

  // Build the highlighted text
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  for (const [start, end] of mergedRanges) {
    // Add text before the highlight
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start))
    }

    // Add the highlighted text
    parts.push(
      <mark key={`${start}-${end}`} className="bg-yellow-200 dark:bg-yellow-800">
        {text.slice(start, end + 1)}
      </mark>,
    )

    lastIndex = end + 1
  }

  // Add remaining text after the last highlight
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts}</>
}
