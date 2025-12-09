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
import { getYear } from 'date-fns'

export function EventStats({ color }: { color?: string }) {
  const [elementRef, size] = useElementSize()
  const { filteredEvents, filteredInitiator, filteredYear, setYearFilter } = useEventFilterContext()

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

  const otherEventsFilter = useCallback(
    (event: Event) => event.initiator === EventInitiator.OTHER,
    [],
  )

  const extraFilteredEvents = useMemo(() => {
    if (filteredInitiator === EventInitiator.BOSS_LED) {
      return filteredEvents.filter(redundancyFilter)
    } else if (filteredInitiator === EventInitiator.WORKER_LED) {
      return filteredEvents.filter(workerEventsFilter)
    } else if (filteredInitiator === EventInitiator.OTHER) {
      return filteredEvents.filter(otherEventsFilter)
    } else {
      return filteredEvents
    }
  }, [filteredEvents, workerEventsFilter, redundancyFilter, otherEventsFilter, filteredInitiator])

  const { filteredCountryISOA2, setCountryISOA2Filter } = useEventFilterContext()

  const earliestYear = useMemo(() => {
    if (!extraFilteredEvents?.length) {
      return 2025
    }
    return Math.min(...extraFilteredEvents.map((event) => getYear(new Date(event.date))))
  }, [extraFilteredEvents])

  const statsCount =
    filteredInitiator === EventInitiator.WORKER_LED
      ? 1
      : filteredInitiator === EventInitiator.BOSS_LED
        ? 1
        : 2

  const onMouseEvent = useCallback(
    (value: any, event: MouseEvent) => {
      console.log('mouse event', value, event)
      if (value.year) {
        if (filteredYear === value.year.getFullYear()) {
          setYearFilter(null)
        } else {
          setYearFilter(value.year.getFullYear())
        }
      }
    },
    [filteredYear, setYearFilter],
  )

  return (
    <div
      className={twMerge(
        'h-full grid grid-rows-8 gap-4 p-4',
        statsCount === 1 ? 'grid-rows-4' : 'grid-rows-5',
      )}
    >
      <div className={twMerge('row-span-3')}>
        <Map
          countryFilter={filteredCountryISOA2}
          onSelectCountry={setCountryISOA2Filter}
          data={extraFilteredEvents}
          colorRange={
            filteredInitiator === EventInitiator.BOSS_LED
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
      {(filteredInitiator === EventInitiator.WORKER_LED ||
        !filteredInitiator ||
        filteredInitiator === EventInitiator.ALL) && (
        <div className="bg-white rounded-xl p-2">
          <h2 className="text-xl font-bold font-identity mb-2">Worker actions</h2>
          <div ref={elementRef} className="h-full w-full">
            <FrequencyChart
              size={size}
              eventFilter={workerEventsFilter}
              color={color || getCSSVariable(`--color-gw-blue`, true)}
              minYear={earliestYear}
              onMouseEvent={onMouseEvent}
            />
          </div>
        </div>
      )}
      {(filteredInitiator === EventInitiator.BOSS_LED ||
        !filteredInitiator ||
        filteredInitiator === EventInitiator.ALL) && (
        <div className="bg-white rounded-xl p-2">
          <h2 className="text-xl font-bold font-identity mb-2">Redundancies</h2>
          <div ref={elementRef} className="h-full w-full">
            <FrequencyChart
              size={size}
              countBy="headcount"
              eventFilter={redundancyFilter}
              color={getCSSVariable(`--color-gw-orange`, true)}
              minYear={earliestYear}
              onMouseEvent={onMouseEvent}
            />
          </div>
        </div>
      )}
    </div>
  )
}
