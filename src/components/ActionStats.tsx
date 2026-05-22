'use client'

import { useCallback, useMemo } from 'react'
import { useActionFilterContext } from './ActionFilterContextProvider'
import { getCSSVariable } from '@/utils/css'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { ActionInitiatorFilter } from '@/collections/enums'
import { Category, Action } from '@/payload-types'
import { Map } from './Map/Map'
import { twMerge } from 'tailwind-merge'
import dynamic from 'next/dynamic'
const FrequencyChart = dynamic(() => import('./FrequencyChart').then((mod) => mod.FrequencyChart), {
  ssr: false,
})
import { getYear } from 'date-fns'

export function ActionStats({ color, graphs = true }: { color?: string; graphs?: boolean }) {
  const [elementRef, size] = useElementSize()
  const { filteredActions, filteredInitiator, filteredYear, setYearFilter } =
    useActionFilterContext()

  const workerActionsFilter = useCallback(
    (action: Action) => action.initiator === ActionInitiatorFilter.WORKER_LED,
    [],
  )

  const redundancyFilter = useCallback(
    (action: Action) =>
      (action.initiator === ActionInitiatorFilter.BOSS_LED &&
        action.categories?.some((category) => (category as Category).name === 'redundancy')) ||
      false,
    [],
  )

  const otherActionsFilter = useCallback(
    (action: Action) => action.initiator === ActionInitiatorFilter.OTHER,
    [],
  )

  const extraFilteredActions = useMemo(() => {
    if (filteredInitiator === ActionInitiatorFilter.BOSS_LED) {
      return filteredActions.filter(redundancyFilter)
    } else if (filteredInitiator === ActionInitiatorFilter.WORKER_LED) {
      return filteredActions.filter(workerActionsFilter)
    } else if (filteredInitiator === ActionInitiatorFilter.OTHER) {
      return filteredActions.filter(otherActionsFilter)
    } else {
      return filteredActions
    }
  }, [
    filteredActions,
    workerActionsFilter,
    redundancyFilter,
    otherActionsFilter,
    filteredInitiator,
  ])

  const { filteredCountryISOA2, setCountryISOA2Filter } = useActionFilterContext()

  const earliestYear = useMemo(() => {
    if (!extraFilteredActions?.length) {
      return 2025
    }
    return Math.min(...extraFilteredActions.map((action) => getYear(new Date(action.date))))
  }, [extraFilteredActions])

  const statsCount = !graphs
    ? 0
    : filteredInitiator === ActionInitiatorFilter.WORKER_LED
      ? 1
      : filteredInitiator === ActionInitiatorFilter.BOSS_LED
        ? 1
        : 2

  const onMouseInteraction = useCallback(
    (value: any, mouseEvent: MouseEvent) => {
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
          data={extraFilteredActions}
          colorRange={
            filteredInitiator === ActionInitiatorFilter.BOSS_LED
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
          {(filteredInitiator === ActionInitiatorFilter.WORKER_LED ||
            !filteredInitiator ||
            filteredInitiator === ActionInitiatorFilter.ALL) && (
            <div className="px-4 mb-4">
              <h2 className="text-xl font-bold font-identity mb-2">Worker actions</h2>
              <div ref={elementRef} className="h-full w-full">
                <FrequencyChart
                  size={size}
                  actionFilter={workerActionsFilter}
                  color={color || getCSSVariable(`--color-gw-blue`, true)}
                  minYear={earliestYear}
                  // onMouseInteraction={onMouseInteraction}
                />
              </div>
            </div>
          )}
          {(filteredInitiator === ActionInitiatorFilter.BOSS_LED ||
            !filteredInitiator ||
            filteredInitiator === ActionInitiatorFilter.ALL) && (
            <div className="px-4 mb-4">
              <h2 className="text-xl font-bold font-identity mb-2">Redundancies</h2>
              <div ref={elementRef} className="h-full w-full">
                <FrequencyChart
                  size={size}
                  countBy="headcount"
                  actionFilter={redundancyFilter}
                  color={getCSSVariable(`--color-gw-orange`, true)}
                  minYear={earliestYear}
                  // onMouseInteraction={onMouseInteraction}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
