import {
  EventFilterContextProvider,
  useEventFilterContext,
} from '@/components/EventFilterContextProvider'
import { EventFilter } from './components/EventFilter'
import { Campaign, Category, Company, Country, Event, OrganisingGroup } from '@/payload-types'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { EventStats } from '@/components/EventStats'
import { EventList } from '@/components/EventList'

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
  return (
    <EventFilterContextProvider events={events}>
      <div className="homepage">
        <div className="content-wrapper py-4 bg-white border-b border-gray-200">
          <EventFilter
            countries={countries}
            categories={categories}
            companies={companies}
            organisingGroups={organisingGroups}
            campaigns={campaigns}
            // searchQuery={searchQuery}
            // setSearchQuery={setSearchQuery}
          />
        </div>

        <ResizablePanelGroup direction="horizontal" className="w-full h-screen">
          <ResizablePanel defaultSize={40}>
            <div className="sticky top-6 h-[calc(100vh-60px)]">
              <EventStats />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60}>
            <EventList linkStyle="soft" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </EventFilterContextProvider>
  )
}
