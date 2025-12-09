'use client'

import { Category, Event } from '@/payload-types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RenderPlot, usePlotConfig } from '@/components/Plot'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { EventCard } from './EventCard'
import { addDays, differenceInDays, formatDate } from 'date-fns'
import { parseAsString, useQueryState } from 'nuqs'
import qs from 'query-string'
import { extent } from 'd3-array'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { CategoryLabel } from './CategoryLabel'
import { getCSSVariable } from '@/utils/css'

export function EventTimeline({ events }: { events: Event[] }) {
  const [currentEventId, setCurrentEventId] = useQueryState<string>(
    'event',
    parseAsString.withOptions({ clearOnDefault: true }),
  )

  const [elementRef, size] = useElementSize()

  return (
    <div>
      <div className="px-8" ref={elementRef}>
        <h2 className="text-2xl font-bold mb-4 font-identity">Timeline</h2>
        <Timeline
          events={events}
          currentEventId={currentEventId}
          setCurrentEventId={setCurrentEventId}
          size={size}
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
  currentEventId,
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
      api.off('select', (e) => {
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
  size,
}: {
  events: Event[]
  currentEventId: string | null
  setCurrentEventId: (id: string) => void
  size: { width: number; height: number }
}) {
  const plotConfig = usePlotConfig(
    (Plot) => {
      const dateRange = extent(events.map((e) => new Date(e.date)))
      const dayRange = differenceInDays(dateRange[1] || new Date(), dateRange[0] || new Date())
      const plot = Plot.plot({
        marginTop: 15,
        marginBottom: 25,
        marginLeft: 10,
        marginRight: 10,
        height: 120,
        width: size.width,
        axis: null,
        style: {
          overflow: 'visible',
        },
        x: {
          axis: 'bottom',
          grid: true,
          tickFormat: (x) => formatDate(new Date(x), 'dd MMM yyyy'),
          ticks: Plot.utcInterval(
            dayRange < 7
              ? '7 days'
              : dayRange < 30
                ? '1 week'
                : dayRange < 90
                  ? '1 month'
                  : dayRange < 365
                    ? '3 months'
                    : dayRange < 365 * 10
                      ? '1 years'
                      : '5 years',
          ),
        },
        marks: [
          // Add x axis for dates
          Plot.line(events, {
            x: (d: Event) => new Date(d.date),
            y: 25,
            sort: { y: 'x' },
          }),
          Plot.dot(events, {
            x: (d: Event) => new Date(d.date),
            y: 25,
            r: (d: Event) => Number(d.id === currentEventId ? 12 : 8),
            fill: (d: Event) =>
              d.initiator === 'WORKER_LED'
                ? getCSSVariable('--color-gw-blue')
                : getCSSVariable('--color-gw-orange'),
          }),
          Plot.text(events, {
            x: (d: Event) => new Date(d.date),
            // Alternate y between 10 and -10
            dy: -25,
            text: (d: Event) =>
              d.categories
                ?.map((c) => `${(c as Category).emoji || ''} ${capitalise((c as Category).name)}`)
                .join(' '),
            className: 'text-sm font-bold',
            textAnchor: 'middle',
          }),
          Plot.text(events, {
            x: (d: Event) => new Date(d.date),
            dy: 25,
            text: (d: Event) => formatDate(new Date(d.date), 'dd MMM'),
            textAnchor: 'middle',
            className: 'text-sm font-bold',
          }),
        ],
      })

      return plot
    },
    [events, size.width, size.height, currentEventId],
  )

  const handleMouseEvent = useCallback((value: any, event: MouseEvent) => {
    function isEvent(value: any): value is Event {
      return (
        typeof value === 'object' &&
        value !== null &&
        typeof value.id === 'string' &&
        typeof value.date === 'string' &&
        Array.isArray(value.categories)
      )
    }
    if (isEvent(value)) {
      setCurrentEventId(value.id)
    }
  }, [])

  return (
    <div className="bg-white rounded-xl px-6 py-4 my-4">
      <RenderPlot plot={plotConfig} onMouseEvent={handleMouseEvent} />
    </div>
  )
}

function capitalise(string: string) {
  // Capitalise each word
  return string.replace(/\b\w/g, (char) => char.toUpperCase())
}
