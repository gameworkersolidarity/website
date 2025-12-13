'use client'

import { EventFilterContextProvider } from '@/components/EventFilterContextProvider'
import { EventFilter } from './components/EventFilter'
import { Campaign, Category, Company, Country, Event, OrganisingGroup } from '@/payload-types'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { EventStats } from '@/components/EventStats'
import { EventList } from '@/components/EventList'
import { useState } from 'react'
import { ZoomLevel } from '@/utils/global-state'

export function HomepageClient({
  events,
  countries,
  categories,
  companies,
  organisingGroups,
  campaigns,
}: {
  events: Event[]
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  campaigns: Campaign[]
}) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(ZoomLevel.Preview)

  return (
    <EventFilterContextProvider
      events={events}
      countries={countries}
      categories={categories}
      companies={companies}
      organisingGroups={organisingGroups}
      campaigns={campaigns}
    >
      <div className="homepage">
        <ResizablePanelGroup direction="horizontal" className="w-full h-screen">
          <ResizablePanel defaultSize={40}>
            <div className="sticky top-6 h-[calc(100vh-60px)]">
              <EventStats />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60}>
            <EventList
              linkStyle="soft"
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              showFilter
              eventFilterProps={{
                years: false,
                campaigns: false,
              }}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </EventFilterContextProvider>
  )
}
