import useSWR from 'swr'
import { FrequencyChart } from './FrequencyChart'
import { payloadClient } from '@/utils/payload'
import { Category, Event } from '@/payload-types'
import { EventFilterContextProvider } from './EventFilterContextProvider'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { getCSSVariable } from '@/utils/css'
import { useCallback, useMemo } from 'react'
import * as Plot from '@observablehq/plot'
import { formatDate } from 'date-fns'
import { EventInitiator } from '@/collections/enums'
import { useRouter } from 'next/navigation'
import { getFilterPath } from '@/utils/global-state'
import { EventFilter } from '../app/(frontend)/components/EventFilter'

export const EventHistogramContext = ({ event }: { event: Event }) => {
  const events = useSWR('all-events', () =>
    payloadClient.find({ collection: 'events', pagination: false, depth: 0, sort: '-date' }),
  )

  const [elementRef, size] = useElementSize()

  const eventType = useMemo(() => {
    if (
      event.initiator === EventInitiator.BOSS_LED ||
      event.categories?.some((category) => (category as Category).slug === 'redundancy')
    ) {
      return 'Redundancies'
    } else if (event.initiator === EventInitiator.WORKER_LED) {
      return 'Worker actions'
    }
    return 'Other'
  }, [event])

  const eventFilter = useCallback(
    (e: Event) => {
      if (eventType === 'Redundancies') {
        return !!(
          e.initiator === EventInitiator.BOSS_LED ||
          e.categories?.some((category) => (category as Category).slug === 'redundancy')
        )
      } else if (eventType === 'Worker actions') {
        return !!(e.initiator === EventInitiator.WORKER_LED)
      }
      return true
    },
    [eventType],
  )

  const router = useRouter()

  if (events.isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="rounded-xl">
      <h2 className="text-xl font-bold font-identity mb-2">{eventType}</h2>
      <div ref={elementRef} className="h-[200px] w-full">
        <EventFilterContextProvider events={events.data?.docs || []}>
          <FrequencyChart
            size={size}
            color={
              eventType === 'Redundancies'
                ? getCSSVariable(`--color-gw-orange`, true)
                : getCSSVariable(`--color-gw-blue`, true)
            }
            highlightDate={new Date(event.date)}
            eventFilter={eventFilter}
            highlightColor={getCSSVariable(`--color-snot-500`, true)}
            countBy={eventType === 'Redundancies' ? 'headcount' : 'events'}
          />
        </EventFilterContextProvider>
      </div>
    </div>
  )
}
