'use client'

import { EventContent } from '@/app/(frontend)/events/[slug]/EventContent'
import { Event } from '@/payload-types'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { List, ListIcon, Receipt, ReceiptIcon, Rows2, Rows4 } from 'lucide-react'
import { CompactEventList } from './CompactEventList'

export enum ZoomLevel {
  Compact = 'compact',
  Preview = 'preview',
  Detailed = 'detailed',
}

function ZoomlevelSelector({
  value,
  onChange,
}: {
  value: ZoomLevel
  onChange: (value: ZoomLevel) => void
}) {
  return (
    <Tabs
      defaultValue={value}
      value={value}
      onValueChange={(e) => onChange(e as ZoomLevel)}
      className="w-[400px]"
    >
      <TabsList>
        <TabsTrigger value={ZoomLevel.Compact}>
          <Rows4 /> Compact
        </TabsTrigger>
        <TabsTrigger value={ZoomLevel.Preview}>
          <Rows2 /> Preview
        </TabsTrigger>
        <TabsTrigger value={ZoomLevel.Detailed}>
          <ReceiptIcon /> Detailed
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export function EventList({ events }: { events: Event[] }) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(ZoomLevel.Compact)

  return (
    <div className="flex flex-col gap-2">
      <ZoomlevelSelector value={zoomLevel} onChange={setZoomLevel} />
      {zoomLevel === ZoomLevel.Compact ? (
        <CompactEventList events={events} />
      ) : zoomLevel === ZoomLevel.Preview ? (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <div key={event.id}>
              <EventContent initialEvent={event} isDraftMode={false} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {events.map((event) => (
            <div key={event.id}>
              <EventContent initialEvent={event} isDraftMode={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
