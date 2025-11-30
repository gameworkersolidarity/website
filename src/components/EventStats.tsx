'use client'

import { useCallback, useMemo } from 'react'
import { useEventFilterContext } from './EventFilterContextProvider'
import { getCSSVariable } from '@/utils/css'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { EventInitiator } from '@/collections/enums'
import { Category, Event } from '@/payload-types'
import { Map } from './Map/Map'
import { twMerge } from 'tailwind-merge'
import { FrequencyChart } from './FrequencyChart'

export function EventStats() {
  const [elementRef, size] = useElementSize()
  const { filteredEvents, initiatorFilter } = useEventFilterContext()

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

  const extraFilteredEvents = useMemo(() => {
    if (initiatorFilter === EventInitiator.BOSS_LED) {
      return filteredEvents.filter(redundancyFilter)
    } else {
      return filteredEvents.filter(workerEventsFilter)
    }
  }, [filteredEvents, workerEventsFilter, redundancyFilter, initiatorFilter])

  return (
    <div className="h-full grid grid-rows-5 gap-4 p-4">
      <div className={twMerge(initiatorFilter ? 'row-span-4' : 'row-span-3')}>
        <Map
          data={extraFilteredEvents}
          colorRange={
            initiatorFilter === EventInitiator.BOSS_LED
              ? [
                  getCSSVariable(`--color-orange-50`, true),
                  getCSSVariable(`--color-orange-200`, true),
                  getCSSVariable(`--color-gw-orange`, true),
                ]
              : [
                  getCSSVariable(`--color-blue-50`, true),
                  getCSSVariable(`--color-blue-200`, true),
                  getCSSVariable(`--color-gw-blue`, true),
                ]
          }
        />
      </div>
      {(initiatorFilter === EventInitiator.WORKER_LED || !initiatorFilter) && (
        <div className="bg-white rounded-xl p-2">
          <h2 className="text-xl font-bold font-identity mb-2">Worker actions</h2>
          <div ref={elementRef} className="h-full w-full">
            <FrequencyChart
              size={size}
              eventFilter={workerEventsFilter}
              color={getCSSVariable(`--color-gw-blue`, true)}
            />
          </div>
        </div>
      )}
      {(initiatorFilter === EventInitiator.BOSS_LED || !initiatorFilter) && (
        <div className="bg-white rounded-xl p-2">
          <h2 className="text-xl font-bold font-identity mb-2">Redundancies</h2>
          <div ref={elementRef} className="h-full w-full">
            <FrequencyChart
              size={size}
              countBy="headcount"
              eventFilter={redundancyFilter}
              color={getCSSVariable(`--color-gw-orange`, true)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
