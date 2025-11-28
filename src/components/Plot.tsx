'use client'

import * as Plot from '@observablehq/plot'
import { useMemo } from 'react'

export function usePlotConfig(cb: (plot: typeof Plot) => HTMLElement | SVGElement, memoize: any[]) {
  return useMemo(() => {
    try {
      return cb(Plot)
    } catch (error) {
      console.error("Couldn't create plot", error)
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, memoize)
}

export function RenderPlot({ config }: { config?: HTMLElement | SVGElement | null }) {
  if (!config?.outerHTML) return null
  return (
    <div
      className="w-full h-full"
      dangerouslySetInnerHTML={{ __html: config.outerHTML }}
      suppressHydrationWarning
    />
  )
}
