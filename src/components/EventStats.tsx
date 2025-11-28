'use client'

import { useCallback, useMemo } from 'react'
import { useEventFilterContext } from './EventFilterContextProvider'
import { RenderPlot, usePlotConfig } from './Plot'
import { getCSSVariable } from '@/utils/css'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { EventInitiator } from '@/collections/enums'
import { range } from 'd3-array'
import { Category, Event } from '@/payload-types'
// import { Map } from './Map/Map'

export function EventStats() {
  const [elementRef, size] = useElementSize()
  const { filteredEvents } = useEventFilterContext()

  const workerEventsFilter = useCallback(
    (event: Event) => event.initiator === EventInitiator.WORKER_LED,
    [],
  )
  const redundancyFilter = useCallback(
    (event: Event) =>
      (event.initiator === EventInitiator.BOSS_LED &&
        event.categories?.some((category) => (category as Category).name === 'Redundancy')) ||
      false,
    [],
  )
  return (
    <div className="h-full grid grid-rows-5 gap-4 p-4">
      <div className="row-span-3">{/* <Map data={filteredEvents} /> */}</div>
      <div className="bg-white rounded-xl p-2">
        <h2 className="text-xl font-bold font-identity mb-2">Worker actions</h2>
        <div ref={elementRef} className="h-full w-full">
          <FrequencyChart size={size} eventFilter={workerEventsFilter} color="--color-gw-pink" />
        </div>
      </div>
      <div className="bg-white rounded-xl p-2">
        <h2 className="text-xl font-bold font-identity mb-2">Redundancies</h2>
        <div ref={elementRef} className="h-full w-full">
          <FrequencyChart
            size={size}
            countBy="headcount"
            eventFilter={redundancyFilter}
            color="--color-gw-blue"
          />
        </div>
      </div>
    </div>
  )
}

function FrequencyChart({
  size,
  eventFilter,
  color,
  countBy = 'events',
}: {
  size: { width: number; height: number }
  eventFilter: (event: Event) => boolean
  color: string
  countBy?: 'headcount' | 'events'
}) {
  const { filteredEvents } = useEventFilterContext()

  const workerActions = useMemo(() => {
    return filteredEvents.filter(eventFilter)
  }, [filteredEvents, eventFilter])

  const eventsPerYear = useMemo(() => {
    const fullDomainOfYears = range(2015, new Date().getFullYear() + 1)
    const eventsPerYear = fullDomainOfYears.reduce(
      (acc, year) => {
        if (countBy === 'headcount') {
          acc[year] = workerActions
            .filter((event) => new Date(event.date).getFullYear() === year)
            .reduce((acc, event) => acc + (event.headcount || 0), 0)
        } else {
          acc[year] = workerActions.filter(
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
  }, [workerActions, countBy])

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
            fill: getCSSVariable(color),
          }),
        ],
      })
    },
    [eventsPerYear, size.width, size.height, countBy],
  )

  return <RenderPlot config={plotConfig} />
}
