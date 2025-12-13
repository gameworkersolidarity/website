import { ZoomLevel } from '@/utils/global-state'
import { useRef, useEffect, useState } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'
import {
  EventFilterContextProvider,
  EventFilterContextProviderProps,
} from '@/components/EventFilterContextProvider'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { EventStats } from '@/components/EventStats'
import { EventList } from '@/components/EventList'
import { Event } from '@/payload-types'
import { TimelineLabelProperty } from '@/components/EventsTimeline'

export function EventExplorer({
  eventFilterContextProps,
  events,
  primaryColor,
  linkStyle,
  timelineBy,
  overrideDefaultZoomLevel,
}: {
  eventFilterContextProps?: Partial<EventFilterContextProviderProps>
  events: Event[]
  primaryColor?: string
  linkStyle: 'soft' | 'hard'
  timelineBy?: TimelineLabelProperty
  overrideDefaultZoomLevel?: ZoomLevel
}) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(
    overrideDefaultZoomLevel || ZoomLevel.Preview,
  )

  const collapsibleRef = useRef<ImperativePanelHandle>(null)

  useEffect(() => {
    if (collapsibleRef.current && zoomLevel === ZoomLevel.Timeline) {
      collapsibleRef.current.collapse()
    } else if (collapsibleRef.current && zoomLevel !== ZoomLevel.Timeline) {
      collapsibleRef.current.expand()
    }
  }, [collapsibleRef, zoomLevel])

  return (
    <EventFilterContextProvider events={events} {...(eventFilterContextProps || {})}>
      <ResizablePanelGroup direction="horizontal" className="w-full h-screen bg-background">
        <ResizablePanel
          defaultSize={40}
          collapsible
          ref={collapsibleRef}
          className="transition-all duration-500 ease-in-out"
        >
          <div className="sticky top-6 h-[calc(100vh-60px)]">
            <EventStats color={primaryColor} graphs={false} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60}>
          <EventList
            linkStyle={linkStyle}
            timelineBy={timelineBy}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </EventFilterContextProvider>
  )
}
