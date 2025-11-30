'use client'

import { Event } from '@/payload-types'
import { useEffect, useState } from 'react'
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
import { addDays } from 'date-fns'

export function EventTimeline({ events }: { events: Event[] }) {
  const [currentEventId, setCurrentEventId] = useState<string | null>(events[0].id)

  return (
    <div>
      <h3>Timeline</h3>
      <div>{currentEventId}</div>
      <Slideshow
        events={events}
        currentEventId={currentEventId}
        setCurrentEventId={setCurrentEventId}
      />
      <Timeline
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

  useEffect(() => {
    if (!api) {
      return
    }

    api.scrollTo(events.findIndex((event) => event.id === currentEventId))
  }, [api, events])

  useEffect(() => {
    if (!api) {
      return
    }

    api.on('select', () => {
      const index = api.selectedScrollSnap() + 1
      setCurrentEventId(events[index].id)
    })

    return () => {
      api.off('select', () => {
        const index = api.selectedScrollSnap() + 1
        setCurrentEventId(events[index].id)
      })
    }
  }, [api, events, setCurrentEventId])

  return (
    <div>
      <Carousel setApi={setApi}>
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
  const plotConfig = usePlotConfig(
    (Plot) => {
      return Plot.plot({
        marginLeft: 130,
        axis: null,
        x: {
          axis: 'top',
          grid: true,
          tickFormat: (x) => new Date(x),
          ticks: Plot.utcInterval('1 year'),
        },
        marks: [
          Plot.barX(events, {
            x1: (d) => d.date,
            x2: (d) => addDays(d.date, 1),
            y: 'name',
            sort: { y: 'x1' },
          }),
          Plot.text(events, {
            x: (d) => d.date,
            y: 'name',
            text: 'name',
            textAnchor: 'end',
            dx: -3,
          }),
        ],
      })
    },
    [events],
  )

  return (
    <div>
      <RenderPlot config={plotConfig} />
    </div>
  )
}
