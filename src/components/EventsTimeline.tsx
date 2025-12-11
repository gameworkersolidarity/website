'use client'

import { Category, Company, Country, Event, OrganisingGroup } from '@/payload-types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EventCard } from './EventCard'
import { differenceInDays, formatDate } from 'date-fns'
import { extent } from 'd3-array'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { getCSSVariable } from '@/utils/css'
import { scaleTime } from '@visx/scale'
import { AxisBottom } from '@visx/axis'
import { HtmlLabel } from '@visx/annotation'
import { LinePath, Circle, Line } from '@visx/shape'
import { Group } from '@visx/group'
import { Text } from '@visx/text'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { CategoryLabel } from './CategoryLabel'
import { CountryLabel } from './CountryLabel'
import { OrganisingGroupLabel } from './OrganisingGroupLabel'
import { CompanyLabel } from './CompanyLabel'

export function EventTimeline({
  events,
  labelProperty,
}: {
  events: Event[]
  labelProperty?: LabelProperty
}) {
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)

  if (!events?.length || events.length < 3) return null

  return (
    <div>
      <div className="py-4 px-4 sm:px-5 lg:px-6 xl:px-8 bg-white">
        <h2 className="text-2xl font-bold mb-4 font-identity">Timeline</h2>
        <div className="px-4">
          <Timeline
            events={events}
            currentEventId={currentEventId}
            setCurrentEventId={setCurrentEventId}
            labelProperty={labelProperty}
          />
        </div>
      </div>
      <div className="my-4">
        <Slideshow
          events={events}
          currentEventId={currentEventId}
          setCurrentEventId={setCurrentEventId}
        />
      </div>
    </div>
  )
}

export function Slideshow({
  events,
  currentEventId,
  setCurrentEventId: __setCurrentEventId,
}: {
  events: Event[]
  currentEventId: string | null
  setCurrentEventId: (id: string) => void
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [autoplay, setAutoplay] = useState(false)

  const setCurrentEventId = useCallback(
    (id: string, autoplay: boolean = false) => {
      __setCurrentEventId(id)
      setAutoplay(autoplay)
    },
    [__setCurrentEventId, setAutoplay],
  )

  // Scroll to current event when it changes
  useEffect(() => {
    if (!currentEventId || !scrollContainerRef.current) return

    const itemElement = itemRefs.current.get(currentEventId)
    if (itemElement) {
      itemElement.scrollIntoView({
        // @ts-expect-error - container is a valid option for scrollIntoView
        container: 'nearest',
        behavior: 'smooth',
        block: 'start',
        inline: 'center',
      })
    }
  }, [currentEventId])

  // Handle scroll events to update current event
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2
    // Find the item closest to the center
    let closestItem: { id: string; distance: number } | null = null
    for (const [id, element] of itemRefs.current.entries()) {
      const rect = element.getBoundingClientRect()
      const itemCenter = rect.left + rect.width / 2
      const distance = Math.abs(itemCenter - containerCenter)
      if (!closestItem || distance < closestItem.distance) {
        closestItem = { id, distance }
      }
    }
    if (closestItem && closestItem.id !== currentEventId) {
      setCurrentEventId(closestItem.id)
    }
  }, [currentEventId, setCurrentEventId])

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(() => {
        const index = events.findIndex((e) => e.id === currentEventId)
        if (index === -1) return
        setCurrentEventId(index < events.length - 1 ? events[index + 1].id : events[0].id)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [autoplay, currentEventId, events, setCurrentEventId])

  const sortedEvents = useMemo(
    function sortEventsByOldestFirst() {
      return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    },
    [events],
  )

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        onScrollEndCapture={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth items-start"
      >
        {sortedEvents.map((event, index) => (
          <div
            key={event.id}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(event.id, el)
              } else {
                itemRefs.current.delete(event.id)
              }
            }}
            className="shrink-0 w-full snap-center flex items-center justify-center gap-1 md:gap-4"
          >
            <ArrowLeft
              className={twMerge('w-20 cursor-pointer', index > 0 ? 'block' : 'invisible')}
              size={20}
              onClick={() => setCurrentEventId(events[index - 1].id)}
            />
            <EventCard data={event} />
            <ArrowRight
              className={twMerge(
                'w-20 cursor-pointer',
                index < events.length - 1 ? 'block' : 'invisible',
              )}
              size={20}
              onClick={() => setCurrentEventId(events[index + 1].id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

type LabelProperty =
  | 'categories'
  | 'companies'
  | 'organisingGroups'
  | 'countries'
  | 'location'
  | 'name'

export function Timeline({
  events,
  currentEventId,
  setCurrentEventId,
  labelProperty = 'categories',
}: {
  events: Event[]
  currentEventId: string | null
  setCurrentEventId: (id: string) => void
  labelProperty?: LabelProperty
}) {
  const divHeight = 300
  const [elementRef, size] = useElementSize()
  const margin = { top: 15, right: 10, bottom: 25, left: 10 }
  const width = size.width - margin.left - margin.right
  const height = divHeight - margin.top - margin.bottom
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
      ? getCSSVariable('--color-gw-blue', false, '#000')
      : getCSSVariable('--color-gw-orange', false, '#000')
  }, [])

  // Get radius for event
  const getEventRadius = useCallback(
    (event: Event) => {
      return event.id === currentEventId ? 12 : 8
    },
    [currentEventId],
  )

  return (
    <div ref={elementRef} className="h-full w-full">
      <svg width={size.width} height={divHeight} style={{ overflow: 'visible' }}>
        <Group left={margin.left} top={margin.top}>
          {/* Grid lines */}
          {xScale.ticks(numTicks).map((tick, i) => {
            const x = xScale(tick)
            return (
              <Line key={i} x1={x} y1={0} x2={x} y2={height} stroke="#e5e7eb" strokeWidth={1} />
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

          {/* Vertical ines from circle to text labels */}
          {sortedEvents.map((event, index) => {
            const x = xScale(new Date(event.date))
            if (!shouldAppear(index, event.id)) return null
            return (
              <Line
                key={`line-${event.id}`}
                x1={x}
                y1={timelineY}
                x2={x}
                y2={getLabelY(index, event.id, -5)}
                stroke={getEventColor(event)}
                strokeWidth={1}
              />
            )
          })}

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
              />
            )
          })}

          {/* Labels above timeline */}
          {sortedEvents.map((event, index) => {
            if (!shouldAppear(index, event.id)) return null
            const x = xScale(new Date(event.date))
            // let labelText
            // if (labelProperty === 'categories') {
            //   labelText =
            //     event.categories
            //       ?.map((c) => `${(c as Category).emoji || ''} ${capitalise((c as Category).name)}`)
            //       .join(' ') || ''
            // } else if (labelProperty === 'companies') {
            //   labelText = event.companies?.map((c) => `${(c as Company).name}`).join(' ') || ''
            // } else if (labelProperty === 'organisingGroups') {
            //   labelText =
            //     event.organisingGroups?.map((c) => `${(c as OrganisingGroup).name}`).join(' ') || ''
            // } else if (labelProperty === 'countries') {
            //   labelText =
            //     event.countries
            //       ?.map((c) => {
            //         const country = c as Country
            //         // Add flag emoji if present
            //         const flag = country.emoji ? `${country.emoji} ` : ''
            //         return `${flag}${country.name}`
            //       })
            //       .join(' ') || ''
            // } else if (labelProperty === 'location') {
            //   labelText = event.location || ''
            // } else if (labelProperty === 'name') {
            //   labelText = event.name || ''
            // }
            // if (!labelText) return null
            return (
              <HtmlLabel
                key={`label-${event.id}`}
                x={x}
                y={getLabelY(index, event.id)}
                horizontalAnchor="middle"
                verticalAnchor="middle"
              >
                <div
                  className={twMerge(
                    'whitespace-nowrap flex flex-col items-center text-center',
                    event.id === currentEventId && 'bg-snot-300 rounded-md px-2 py-1 border-none',
                  )}
                >
                  {event.id === currentEventId && (
                    <div className="text-xs">{formatDate(new Date(event.date), 'dd MMM yyyy')}</div>
                  )}
                  <div className="text-xs font-bold">
                    {labelProperty === 'categories'
                      ? event.categories?.map((c) => (
                          <CategoryLabel category={c as Category} key={(c as Category).id} />
                        ))
                      : null}
                    {labelProperty === 'companies'
                      ? event.companies?.map((c) => (
                          <CompanyLabel company={c as Company} key={(c as Company).id} />
                        ))
                      : null}
                    {labelProperty === 'organisingGroups'
                      ? event.organisingGroups?.map((c) => (
                          <OrganisingGroupLabel
                            organisingGroup={c as OrganisingGroup}
                            key={(c as OrganisingGroup).id}
                          />
                        ))
                      : null}
                    {labelProperty === 'countries'
                      ? event.countries?.map((c) => (
                          <CountryLabel country={c as Country} key={(c as unknown as Country).id} />
                        ))
                      : null}
                    {labelProperty === 'location' ? event.location : null}
                    {labelProperty === 'name' ? event.name : null}
                  </div>
                </div>
              </HtmlLabel>
              // <Group
              //   key={`label-${event.id}`}
              //   transform={`translate(${x}, ${getLabelY(index, event.id)})`}
              // >
              //   {event.id === currentEventId && (
              //     <g className="-translate-y-4" fill="#fde68a">
              //       <rect
              //         x={-50}
              //         y={-25}
              //         width={100}
              //         height={26}
              //         rx={10}
              //         stroke="#f59e42"
              //         strokeWidth={1.5}
              //       />
              //       <Text
              //         textAnchor="middle"
              //         fontSize={12}
              //         fontWeight="bold"
              //         fill="currentColor"
              //         dy="-9"
              //       >
              //         {formatDate(new Date(event.date), 'dd MMM yy')}
              //       </Text>
              //     </g>
              //   )}
              //   <Text textAnchor="middle" fontSize={12} fontWeight="bold" fill="currentColor">
              //     {labelText}
              //   </Text>
              // </Group>
            )
          })}

          {/* Date labels below timeline */}
          {/* {sortedEvents.map((event) => {
            const x = xScale(new Date(event.date))
            const dateText = formatDate(new Date(event.date), 'dd MMM yy')
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
          })} */}

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
  )

  function shouldAppear(index: number, eventId: string | null) {
    return index % 5 === 0 || eventId === currentEventId
    // if (!eventId || !currentEventId) return false
    // return index % 5 === 0 || eventId === currentEventId
  }

  function getLabelY(index: number, eventId: string | null, offset: number = 0) {
    const gap = 20
    const numLevels = 3
    if (currentEventId && eventId === currentEventId) {
      const aboveBelow = -1
      return timelineY + aboveBelow * (numLevels + 1) * gap + offset * aboveBelow
    }
    const aboveBelow = index % 2 === 0 ? -1 : 1
    const level = Math.floor(index / 2) % numLevels
    const y = timelineY + aboveBelow * (level + 1) * gap + offset * aboveBelow
    return y + offset * aboveBelow
  }
}

function capitalise(string: string) {
  // Capitalise each word
  return string?.replace(/\b\w/g, (char) => char.toUpperCase())
}
