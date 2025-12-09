'use client'

import * as Plot from '@observablehq/plot'
import { useEffect, useMemo, useRef } from 'react'
import { twMerge } from 'tailwind-merge'

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

export function RenderPlot({
  plot,
  className,
  onMouseEvent,
}: {
  plot?: HTMLElement | SVGElement | null
  className?: string
  onMouseEvent?: <T>(value: T, event: MouseEvent) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseEvent(event: Event) {
      if (onMouseEvent && plot) {
        onMouseEvent((plot as any).value, event as MouseEvent)
      }
    }

    if (ref.current && plot) {
      console.log('Rendering plot', plot)
      // replace children with plot
      ref.current.replaceChildren(plot)

      if (onMouseEvent) {
        plot.addEventListener('input', handleMouseEvent)
      }
    }

    return () => {
      if (onMouseEvent) {
        plot?.removeEventListener('input', handleMouseEvent)
      }
    }
  }, [plot, ref, onMouseEvent])

  return <div className={twMerge('w-full h-full', className)} suppressHydrationWarning ref={ref} />
}
