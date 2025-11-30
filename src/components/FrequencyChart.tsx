'use client'

import { useEventFilterContext } from './EventFilterContextProvider'
import { Event } from '@/payload-types'
import { useMemo } from 'react'
import { range } from 'd3-array'
import { getCSSVariable } from '@/utils/css'
import dynamic from 'next/dynamic'
const RenderPlot = dynamic(() => import('./Plot').then((mod) => mod.RenderPlot), { ssr: false })
import { usePlotConfig } from './Plot'

export function FrequencyChart({
  size,
  eventFilter,
  color,
  countBy = 'events',
}: {
  size: { width: number; height: number }
  eventFilter?: (event: Event) => boolean
  color: string
  countBy?: 'headcount' | 'events'
}) {
  const { filteredEvents } = useEventFilterContext()

  const extraFilteredEvents = useMemo(() => {
    return eventFilter ? filteredEvents.filter(eventFilter) : filteredEvents
  }, [filteredEvents, eventFilter])

  const eventsPerYear = useMemo(() => {
    const fullDomainOfYears = range(2015, new Date().getFullYear() + 1)
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
  }, [extraFilteredEvents, countBy])

  const plotConfig = usePlotConfig(
    (Plot) => {
      return Plot.plot({
        width: size.width,
        height: size.height,
        marginBottom: 60,
        y: {
          tickSize: 0,
        },
        x: {
          tickSize: 0,
          ticks: Plot.utcInterval('3 years'),
          // tickFormat: (x) => `'${x.getFullYear().toString().slice(2, 4)}`,
        },
        marks: [
          Plot.barY(eventsPerYear, {
            x: 'year',
            y: countBy,
            fill: color,
          }),
        ],
      })
    },
    [eventsPerYear, size.width, size.height, countBy],
  )

  if (extraFilteredEvents.length === 0) {
    return (
      <div className="pt-5 w-full flex items-center justify-center">
        <p className="text-gray-400 text-xs font-semibold">No events found</p>
      </div>
    )
  }

  return <RenderPlot config={plotConfig} />
}
