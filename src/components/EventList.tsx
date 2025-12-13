'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { History, Newspaper, Rows2, Rows4 } from 'lucide-react'
import { CompactEventList } from './CompactEventList'
import { EventsList } from './EventCard'
import { ZoomLevel } from '@/utils/global-state'
import { useEventFilterContext } from './EventFilterContextProvider'
import pluralize from 'pluralize'
import { EventTimeline, TimelineLabelProperty } from './EventsTimeline'

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
}: {
  linkStyle?: 'soft' | 'hard'
  timelineBy?: TimelineLabelProperty
  zoomLevel: ZoomLevel
  setZoomLevel: (value: ZoomLevel) => void
}) {
  const { filteredEvents: events } = useEventFilterContext()

  return (
    <div className="flex flex-col gap-2 @container">
      <header className="px-4 flex flex-col @xl:flex-row justify-between gap-2 @xl:gap-4 mt-1 sticky top-6 bg-background pt-3 pb-2 z-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-bold font-identity">
            {pluralize('event', events.length, true)}
          </h2>
        </div>
        <ZoomlevelSelector
          value={zoomLevel}
          onChange={setZoomLevel}
          includeTimeline={!!timelineBy}
        />
      </header>
      {zoomLevel === ZoomLevel.Compact ? (
        <div>
          <CompactEventList events={events} linkStyle={linkStyle} />
        </div>
      ) : zoomLevel === ZoomLevel.Preview ? (
        <div className="flex flex-col gap-4 px-4 pb-4">
          <EventsList data={events} />
        </div>
      ) : zoomLevel === ZoomLevel.Timeline ? (
        <div className="flex flex-col gap-4 px-4 pb-4">
          <EventTimeline events={events} labelProperty={timelineBy} />
        </div>
      ) : (
        <div className="flex flex-col gap-8 px-4 pb-4">
          <EventsList data={events} fullDisplay />
        </div>
      )}
    </div>
  )
}
