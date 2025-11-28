'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Newspaper, Rows2, Rows4 } from 'lucide-react'
import { CompactEventList } from './CompactEventList'
import { EventsList } from './EventCard'
import { useZoomLevel, ZoomLevel } from '@/utils/global-state'
import { useEventFilterContext } from './EventFilterContextProvider'

function ZoomlevelSelector({
  value,
  onChange,
}: {
  value: ZoomLevel
  onChange: (value: ZoomLevel) => void
}) {
  return (
    <Tabs defaultValue={value} value={value} onValueChange={(e) => onChange(e as ZoomLevel)}>
      <TabsList>
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

export function EventList() {
  const { filteredEvents: events } = useEventFilterContext()
  const [zoomLevel, setZoomLevel] = useZoomLevel()

  return (
    <div className="flex flex-col gap-2 @container">
      <header className="px-4 flex flex-col @xl:flex-row justify-between gap-2 @xl:gap-4 mt-4 sticky top-6 bg-background pt-3 pb-2 z-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-bold font-identity">{events.length} events</h2>
        </div>
        <ZoomlevelSelector value={zoomLevel} onChange={setZoomLevel} />
      </header>
      {zoomLevel === ZoomLevel.Compact ? (
        <div>
          <CompactEventList events={events} />
        </div>
      ) : zoomLevel === ZoomLevel.Preview ? (
        <div className="flex flex-col gap-4 px-4 pb-4">
          <EventsList data={events} />
        </div>
      ) : (
        <div className="flex flex-col gap-8 px-4 pb-4">
          <EventsList data={events} fullDisplay />
        </div>
      )}
    </div>
  )
}
