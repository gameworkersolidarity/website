'use client'

import { useEventFilterContext } from './EventFilterContextProvider'
import { Event } from '@/payload-types'
import { useMemo } from 'react'
import { range } from 'd3-array'
import dynamic from 'next/dynamic'
const RenderPlot = dynamic(() => import('./Plot').then((mod) => mod.RenderPlot), { ssr: false })
import { usePlotConfig } from './Plot'
import { getYear } from 'date-fns'
import { PlotOptions } from '@observablehq/plot'
import * as Plot from '@observablehq/plot'

export function FrequencyChart({
  size,
  eventFilter,
  color,
  minYear,
  transformPlotConfig,
  highlightDate,
  highlightColor,
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
}) {
  const { filteredEvents } = useEventFilterContext()

  const extraFilteredEvents = useMemo(() => {
    return eventFilter ? filteredEvents.filter(eventFilter) : filteredEvents
  }, [filteredEvents, eventFilter])

  const yearFrom = useMemo(() => {
    return minYear || Math.min(...extraFilteredEvents.map((event) => getYear(new Date(event.date))))
  }, [extraFilteredEvents, minYear])

  const eventsPerYear = useMemo(() => {
    const fullDomainOfYears = range(yearFrom, new Date().getFullYear() + 1)
    const eventsPerYear = fullDomainOfYears.reduce(
      (acc, year) => {
        if (countBy === 'headcount') {
          acc[year] = extraFilteredEvents
            .filter((event) => new Date(event.date).getFullYear() === year)
            .reduce((acc, event) => acc + (event.headcount || 0), 0)
        } else {
          acc[year] = extraFilteredEvents.filter(
            (event) => new Date(event.date).getFullYear() === year,
          ).length
        }
        return acc
      },
      {} as Record<number, number>,
    )
    return Object.entries(eventsPerYear).map(([year, events]) => ({
      year: new Date(Number(year), 0, 1),
      [countBy]: events,
    }))
  }, [extraFilteredEvents, countBy, yearFrom])

  const plotConfig = usePlotConfig(
    (Plot) => {
      let config: PlotOptions = {
        width: size.width,
        height: size.height,
        marginBottom: 60,
        y: {
          tickSize: 0,
          grid: true,
        },
        x: {
          tickSize: 0,
          ticks: Plot.utcInterval(`${new Date().getFullYear() - yearFrom > 10 ? 5 : 3} years`),
          // tickFormat: (x) => `'${x.getFullYear().toString().slice(2, 4)}`,
        },
        marks: [
          Plot.barY(eventsPerYear, {
            x: 'year',
            y: countBy,
            fill: (d) => {
              if (
                highlightDate &&
                new Date(d.year).getFullYear() === new Date(highlightDate).getFullYear()
              ) {
                console.log('highlighted')
                return highlightColor
              }
              return color
            },
          }),
        ],
      }
      if (transformPlotConfig) {
        config = transformPlotConfig(config, Plot)
      }
      return Plot.plot(config)
    },
    [eventsPerYear, size.width, size.height, countBy],
  )

  if (extraFilteredEvents.length === 0) {
    return (
      <div className="pt-5 w-full flex items-center justify-center">
        <p className="opacity-50 text-sm">No data</p>
      </div>
    )
  }

  return <RenderPlot config={plotConfig} />
}
