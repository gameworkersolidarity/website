import { ZoomLevel } from '@/utils/global-state'
import { useRef, useEffect, useState, useMemo } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'
import {
  EventFilterContextProvider,
  EventFilterContextProviderProps,
} from '@/components/EventFilterContextProvider'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { EventStats } from '@/components/EventStats'
import { EventList } from '@/components/EventList'
import { Campaign, Company, Country, OrganisingGroup, Category, Event } from '@/payload-types'
import { TimelineLabelProperty } from '@/global-types'
import { getRelatedObjects } from '@/utils/getRelatedObjects'
import { EventFilterProps } from './EventFilter'
import { getCSSVariable } from '@/utils/css'

export function EventExplorer({
  eventFilterContextProps,
  eventFilterProps,
  showFilter,
  events,
  primaryColor,
  linkStyle,
  timelineBy,
  overrideDefaultZoomLevel,
  graphs = true,
}: {
  eventFilterContextProps?: Partial<EventFilterContextProviderProps>
  eventFilterProps?: Partial<EventFilterProps>
  showFilter?: boolean
  events: Event[]
  primaryColor?: string
  linkStyle: 'soft' | 'hard'
  timelineBy?: TimelineLabelProperty
  overrideDefaultZoomLevel?: ZoomLevel
  graphs?: boolean
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

  const relatedObjects = useMemo(() => getRelatedObjects(events), [events])

  return (
    <EventFilterContextProvider
      events={events}
      countries={relatedObjects.countries}
      categories={relatedObjects.categories}
      companies={relatedObjects.companies}
      organisingGroups={relatedObjects.organisingGroups}
      campaigns={relatedObjects.campaigns}
      {...(eventFilterContextProps || {})}
    >
      <ResizablePanelGroup direction="horizontal" className="w-full h-screen bg-background">
        <ResizablePanel
          defaultSize={40}
          collapsible
          ref={collapsibleRef}
          className="transition-all duration-500 ease-in-out hidden md:block"
        >
          <div className="sticky top-6 h-[calc(100vh-60px)]">
            <EventStats graphs={graphs} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="hidden md:flex" />
        <ResizablePanel defaultSize={60}>
          <EventList
            linkStyle={linkStyle}
            timelineBy={timelineBy}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            showFilter={showFilter}
            eventFilterProps={eventFilterProps}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </EventFilterContextProvider>
  )
}
