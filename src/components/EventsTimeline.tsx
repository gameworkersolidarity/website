'use client'

import { Category, Event } from '@/payload-types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { EventCard } from './EventCard'
import { differenceInDays, formatDate } from 'date-fns'
import { parseAsString, useQueryState } from 'nuqs'
import { extent } from 'd3-array'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { getCSSVariable } from '@/utils/css'
import { scaleTime } from '@visx/scale'
import { AxisBottom } from '@visx/axis'
import { LinePath, Circle } from '@visx/shape'
import { Group } from '@visx/group'
import { Text } from '@visx/text'

export function EventTimeline({ events }: { events: Event[] }) {
  const [currentEventId, setCurrentEventId] = useQueryState<string>(
    'event',
    parseAsString.withOptions({ clearOnDefault: true }),
  )

  return (
    <div>
      <div className="px-8">
        <h2 className="text-2xl font-bold mb-4 font-identity">Timeline</h2>
        <Timeline
          events={events}
          currentEventId={currentEventId}
          setCurrentEventId={setCurrentEventId}
        />
      </div>
      <Slideshow
        events={events}
        currentEventId={currentEventId}
        setCurrentEventId={setCurrentEventId}
      />
    </div>
  )
}

export function Slideshow({
  events,
  setCurrentEventId,
}: {
  events: Event[]
  currentEventId: string | null
  setCurrentEventId: (id: string) => void
}) {
  const [api, setApi] = useState<CarouselApi>()

  // useEffect(() => {
  //   if (!api) return
  //   api.scrollTo(events.findIndex((event) => event.id === currentEventId))
  // }, [api, events, currentEventId])

  useEffect(() => {
    if (!api) {
      return
    }

    api.on('select', () => {
      const index = api.selectedScrollSnap() + 1
      const event = events[index]
      if (event) {
        setCurrentEventId(event.id)
      }
    })

    return () => {
      api.off('select', () => {
        const index = api.selectedScrollSnap() + 1
        const event = events[index]
        if (event) {
          setCurrentEventId(event.id)
        }
      })
    }
  }, [api, events, setCurrentEventId])

  return (
    <div>
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          {events.map((event) => (
            <CarouselItem key={event.id} className="px-8">
              <EventCard data={event} withContext displayStandaloneInfo />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}

export function Timeline({
  events,
  currentEventId,
  setCurrentEventId,
}: {
  events: Event[]
  currentEventId: string | null
  setCurrentEventId: (id: string) => void
}) {
  const [elementRef, size] = useElementSize()
  const margin = { top: 15, right: 10, bottom: 25, left: 10 }
  const width = size.width - margin.left - margin.right
  const height = 120 - margin.top - margin.bottom
  const timelineY = height / 2

  // Calculate date range
  const dateRange = useMemo(() => extent(events.map((e) => new Date(e.date))), [events])
  const minDate = useMemo(() => dateRange[0] || new Date(), [dateRange])
  const maxDate = useMemo(() => dateRange[1] || new Date(), [dateRange])
  const dayRange = useMemo(() => differenceInDays(maxDate, minDate), [maxDate, minDate])

  // Determine number of ticks based on date range
  const numTicks = useMemo(() => {
    if (dayRange < 7) return 7
    if (dayRange < 30) return 5
    if (dayRange < 90) return 4
    if (dayRange < 365) return 4
    if (dayRange < 365 * 10) return 5
    return 6
  }, [dayRange])

  // Create time scale
  const xScale = useMemo(
    () =>
      scaleTime({
        domain: [minDate, maxDate],
        range: [0, width],
      }),
    [minDate, maxDate, width],
  )

  // Sort events by date
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events],
  )

  // Handle click on event
  const handleClick = useCallback(
    (event: Event) => {
      setCurrentEventId(event.id)
    },
    [setCurrentEventId],
  )

  // Get color for event
  const getEventColor = useCallback((event: Event) => {
    return event.initiator === 'WORKER_LED'
      ? getCSSVariable('--color-gw-blue')
      : getCSSVariable('--color-gw-orange')
  }, [])

  // Get radius for event
  const getEventRadius = useCallback(
    (event: Event) => {
      return event.id === currentEventId ? 12 : 8
    },
    [currentEventId],
  )

  return (
    <div className="bg-white rounded-xl px-6 py-4 my-4">
      <div ref={elementRef} className="h-full w-full">
        <svg width={size.width} height={120} style={{ overflow: 'visible' }}>
          <Group left={margin.left} top={margin.top}>
            {/* Grid lines */}
            {xScale.ticks(numTicks).map((tick, i) => {
              const x = xScale(tick)
              return (
                <line key={i} x1={x} y1={0} x2={x} y2={height} stroke="#e5e7eb" strokeWidth={1} />
              )
            })}

            {/* Timeline line */}
            <LinePath
              data={sortedEvents}
              x={(d) => xScale(new Date(d.date))}
              y={() => timelineY}
              stroke="#9ca3af"
              strokeWidth={2}
            />

            {/* Event dots */}
            {sortedEvents.map((event) => {
              const x = xScale(new Date(event.date))
              const color = getEventColor(event)
              const radius = getEventRadius(event)
              return (
                <Circle
                  key={event.id}
                  cx={x}
                  cy={timelineY}
                  r={radius}
                  fill={color}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleClick(event)}
                  onMouseEnter={() => handleClick(event)}
                />
              )
            })}

            {/* Category labels above timeline */}
            {sortedEvents.map((event) => {
              const x = xScale(new Date(event.date))
              const categoryText =
                event.categories
                  ?.map((c) => `${(c as Category).emoji || ''} ${capitalise((c as Category).name)}`)
                  .join(' ') || ''
              return (
                <Text
                  key={`category-${event.id}`}
                  x={x}
                  y={timelineY - 20}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight="bold"
                  fill="currentColor"
                >
                  {categoryText}
                </Text>
              )
            })}

            {/* Date labels below timeline */}
            {sortedEvents.map((event) => {
              const x = xScale(new Date(event.date))
              const dateText = formatDate(new Date(event.date), 'dd MMM')
              return (
                <Text
                  key={`date-${event.id}`}
                  x={x}
                  y={timelineY + 30}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight="bold"
                  fill="currentColor"
                >
                  {dateText}
                </Text>
              )
            })}

            {/* X-axis */}
            <AxisBottom
              top={height}
              scale={xScale}
              numTicks={numTicks}
              tickFormat={(d) => formatDate(d as Date, 'dd MMM yyyy')}
              stroke="#6b7280"
              tickStroke="#6b7280"
              tickLabelProps={() => ({
                fill: '#6b7280',
                fontSize: 12,
                textAnchor: 'middle',
              })}
            />
          </Group>
        </svg>
      </div>
    </div>
  )
}

function capitalise(string: string) {
  // Capitalise each word
  return string.replace(/\b\w/g, (char) => char.toUpperCase())
}
