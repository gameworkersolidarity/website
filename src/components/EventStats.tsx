'use client'

import { useCallback, useMemo } from 'react'
import { useEventFilterContext } from './EventFilterContextProvider'
import { getCSSVariable } from '@/utils/css'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { EventInitiatorFilter } from '@/collections/enums'
import { Category, Event } from '@/payload-types'
import { Map } from './Map/Map'
import { twMerge } from 'tailwind-merge'
import { FrequencyChart } from './FrequencyChart'
import { getYear } from 'date-fns'

export function EventStats({ color, graphs = true }: { color?: string; graphs?: boolean }) {
  const [elementRef, size] = useElementSize()
  const { filteredEvents, filteredInitiator, filteredYear, setYearFilter } = useEventFilterContext()

  const workerEventsFilter = useCallback(
    (event: Event) => event.initiator === EventInitiatorFilter.WORKER_LED,
    [],
  )

  const redundancyFilter = useCallback(
    (event: Event) =>
      (event.initiator === EventInitiatorFilter.BOSS_LED &&
        event.categories?.some((category) => (category as Category).name === 'Redundancy')) ||
      false,
    [],
  )

  const otherEventsFilter = useCallback(
    (event: Event) => event.initiator === EventInitiatorFilter.OTHER,
    [],
  )

  const extraFilteredEvents = useMemo(() => {
    if (filteredInitiator === EventInitiatorFilter.BOSS_LED) {
      return filteredEvents.filter(redundancyFilter)
    } else if (filteredInitiator === EventInitiatorFilter.WORKER_LED) {
      return filteredEvents.filter(workerEventsFilter)
    } else if (filteredInitiator === EventInitiatorFilter.OTHER) {
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

  const statsCount = !graphs
    ? 0
    : filteredInitiator === EventInitiatorFilter.WORKER_LED
      ? 1
      : filteredInitiator === EventInitiatorFilter.BOSS_LED
        ? 1
        : 2

  const onMouseEvent = useCallback(
    (value: any, event: MouseEvent) => {
      const date = value && Array.isArray(value) ? value[0]?.date : null
      if (date) {
        const year = getYear(new Date(date))
        if (filteredYear?.includes(year)) {
          setYearFilter(null)
        } else {
          setYearFilter([year])
        }
      }
    },
    [filteredYear, setYearFilter],
  )

  return (
    <div
      className={twMerge(
        'h-full grid grid-rows-8',
        statsCount === 0 ? 'grid-rows-3' : statsCount === 1 ? 'grid-rows-4' : 'grid-rows-5',
      )}
    >
      <div className={twMerge('row-span-3 m-4')}>
        <Map
          countryFilter={filteredCountryISOA2}
          onSelectCountry={setCountryISOA2Filter}
          data={extraFilteredEvents}
          colorRange={
            filteredInitiator === EventInitiatorFilter.BOSS_LED
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
      {graphs && (
        <>
          {(filteredInitiator === EventInitiatorFilter.WORKER_LED ||
            !filteredInitiator ||
            filteredInitiator === EventInitiatorFilter.ALL) && (
            <div className="px-4 mb-4">
              <h2 className="text-xl font-bold font-identity mb-2">Worker actions</h2>
              <div ref={elementRef} className="h-full w-full">
                <FrequencyChart
                  size={size}
                  eventFilter={workerEventsFilter}
                  color={color || getCSSVariable(`--color-gw-blue`, true)}
                  minYear={earliestYear}
                  // onMouseEvent={onMouseEvent}
                />
              </div>
            </div>
          )}
          {(filteredInitiator === EventInitiatorFilter.BOSS_LED ||
            !filteredInitiator ||
            filteredInitiator === EventInitiatorFilter.ALL) && (
            <div className="px-4 mb-4">
              <h2 className="text-xl font-bold font-identity mb-2">Redundancies</h2>
              <div ref={elementRef} className="h-full w-full">
                <FrequencyChart
                  size={size}
                  countBy="headcount"
                  eventFilter={redundancyFilter}
                  color={getCSSVariable(`--color-gw-orange`, true)}
                  minYear={earliestYear}
                  // onMouseEvent={onMouseEvent}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
