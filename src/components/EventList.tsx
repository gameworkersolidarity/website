'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { History, Newspaper, Rows2, Rows4 } from 'lucide-react'
import { CompactEventList } from './CompactEventList'
import { EventsList } from './EventCard'
import { ZoomLevel } from '@/utils/global-state'
import { useEventFilterContext } from './EventFilterContextProvider'
import pluralize from 'pluralize'
import { EventTimeline } from './EventsTimeline'
import { EventFilter, EventFilterProps } from '@/app/(frontend)/components/EventFilter'
import { TimelineLabelProperty } from '@/global-types'

export function ZoomlevelSelector({
  value,
  onChange,
  includeTimeline = false,
}: {
  value: ZoomLevel
  onChange: (value: ZoomLevel) => void
  includeTimeline?: boolean
}) {
  return (
    <Tabs defaultValue={value} value={value} onValueChange={(e) => onChange(e as ZoomLevel)}>
      <TabsList>
        {includeTimeline && (
          <TabsTrigger value={ZoomLevel.Timeline}>
            <History /> Timeline
          </TabsTrigger>
        )}
        <TabsTrigger value={ZoomLevel.Compact}>
          <Rows4 /> Compact
        </TabsTrigger>
        <TabsTrigger value={ZoomLevel.Preview}>
          <Rows2 /> Preview
        </TabsTrigger>
        <TabsTrigger value={ZoomLevel.Detailed}>
          <Newspaper /> Detailed
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export function EventList({
  linkStyle = 'hard',
  timelineBy,
  zoomLevel,
  setZoomLevel,
  showFilter,
  eventFilterProps,
}: {
  linkStyle?: 'soft' | 'hard'
  timelineBy?: TimelineLabelProperty
  zoomLevel: ZoomLevel
  setZoomLevel: (value: ZoomLevel) => void
  showFilter?: boolean
  hideYear?: boolean
  eventFilterProps?: Partial<EventFilterProps>
}) {
  const { filteredEvents: events, searchQuery } = useEventFilterContext()

  return (
    <div className="flex flex-col gap-2 @container">
      <header className="mt-1 sticky top-6 bg-background pt-3 z-40">
        <div className="px-4 flex flex-col @xl:flex-row justify-between gap-2 @xl:gap-4 pb-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl lg:text-5xl font-bold font-identity">
              {pluralize('event', events.length, true)}
            </h2>
          </div>
          <ZoomlevelSelector
            value={zoomLevel}
            onChange={setZoomLevel}
            includeTimeline={!!timelineBy}
          />
        </div>
        {showFilter && (
          <div className="px-4 py-2 border-t border-b border-gray-200">
            <EventFilter {...(eventFilterProps || {})} />
          </div>
        )}
      </header>
      {zoomLevel === ZoomLevel.Compact ? (
        <div>
          <CompactEventList events={events} linkStyle={linkStyle} searchQuery={searchQuery} />
        </div>
      ) : zoomLevel === ZoomLevel.Preview ? (
        <div className="flex flex-col gap-4 px-4 pb-4">
          <EventsList data={events} searchQuery={searchQuery} />
        </div>
      ) : zoomLevel === ZoomLevel.Timeline ? (
        <div className="flex flex-col gap-4 px-4 pb-4">
          <EventTimeline events={events} labelProperty={timelineBy} searchQuery={searchQuery} />
        </div>
      ) : (
        <div className="flex flex-col gap-8 px-4 pb-4">
          <EventsList data={events} fullDisplay searchQuery={searchQuery} />
        </div>
      )}
    </div>
  )
}
