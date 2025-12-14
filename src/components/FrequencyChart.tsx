'use client'

import { useEventFilterContext } from './EventFilterContextProvider'
import { Event } from '@/payload-types'
import { useMemo } from 'react'
import dynamic from 'next/dynamic'
const RenderPlot = dynamic(() => import('./Plot').then((mod) => mod.RenderPlot), { ssr: false })
import { PlotMouseEvent, usePlotConfig } from './Plot'
import { PlotOptions } from '@observablehq/plot'
import * as Plot from '@observablehq/plot'
import { getDateInterval } from '@/utils/dates'
import { formatDate, getYear } from 'date-fns'

export function FrequencyChart({
  size,
  eventFilter,
  color,
  minYear,
  transformPlotConfig,
  highlightDate,
  highlightColor,
  onMouseEvent,
  countBy = 'events',
}: {
  size: { width: number; height: number }
  eventFilter?: (event: Event) => boolean
  color: string
  minYear?: number
  countBy?: 'headcount' | 'events'
  transformPlotConfig?: (config: PlotOptions, plot: typeof Plot) => PlotOptions
  highlightDate?: Date
  highlightColor?: string
  onMouseEvent?: PlotMouseEvent<any>
}) {
  const { filteredEvents } = useEventFilterContext()

  const extraFilteredEvents = useMemo(() => {
    return eventFilter ? filteredEvents.filter(eventFilter) : filteredEvents
  }, [filteredEvents, eventFilter])

  const dateFrom = useMemo(() => {
    if (minYear) {
      return new Date(minYear, 0, 1)
    }
    return new Date(Math.min(...extraFilteredEvents.map((event) => new Date(event.date).getTime())))
  }, [extraFilteredEvents, minYear])

  const plotConfig = usePlotConfig(
    (Plot) => {
      const domain = [dateFrom, new Date()]
      let config: PlotOptions = {
        width: size.width,
        height: size.height,
        marginBottom: 50,
        y: {
          grid: true,
        },
        x: {
          domain,
        },
        marks: [
          Plot.axisY({
            tickFormat: (d) => (d > Math.floor(d) ? '' : `${d}`),
            tickSize: 0,
          }),
          Plot.axisX({
            textAnchor: 'start',
            tickSize: 0,
          }),
          Plot.rectY(
            extraFilteredEvents,
            Plot.binX(
              {
                y: countBy === 'headcount' ? 'sum' : 'count',
              },
              {
                x: (d: Event) => new Date(d.date),
                ...(countBy === 'headcount' ? { y: 'headcount' } : {}),
                // y: countBy,
                interval: Plot.utcInterval(`1 ${getDateInterval(domain)}`),
                // @ts-expect-error - fill is, in fact, a valid property for BinXInputs
                // fill: color,
                fill: (d: Event) => {
                  try {
                    if (highlightDate && getYear(new Date(d.date)) === getYear(highlightDate)) {
                      return highlightColor
                    }
                    return color
                  } catch {
                    return color
                  }
                },
                tip: true,
              },
            ),
          ),
          // highlightDate
          //   ? Plot.ruleX([new Date(highlightDate)], { stroke: highlightColor, strokeWidth: 3 })
          //   : null,
          // Plot.tip(
          //   extraFilteredEvents,
          //   Plot.pointerX({
          //     x: (d) => new Date(d.date),
          //     y: 'initiator',
          //   }),
          // ),
        ],
      }
      if (transformPlotConfig) {
        config = transformPlotConfig(config, Plot)
      }
      return Plot.plot(config)
    },
    [size.width, size.height, countBy],
  )

  if (extraFilteredEvents.length === 0) {
    return (
      <div className="pt-5 w-full flex items-center justify-center">
        <p className="opacity-50 text-sm">No data</p>
      </div>
    )
  }

  return <RenderPlot plot={plotConfig} onMouseEvent={onMouseEvent} />
}
