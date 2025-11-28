import { getPayload } from 'payload'

import { EventFilter } from './components/EventFilter'
import config from '@/payload.config'
import '@/app/globals.css'
import { draftMode } from 'next/headers'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { EventList } from '@/components/EventList'
import { EventFilterContextProvider } from '@/components/EventFilterContextProvider'
import { EventStats } from '@/components/EventStats'

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = (await draftMode()).isEnabled

  // Fetch all events with related data
  // Include both published and legacy records (where _status is null)
  const eventsResult = await payload.find({
    collection: 'events',
    where: {
      // Only fetch published content when not in draft mode
      ...(!isDraftMode
        ? {
            _status: {
              equals: 'published',
            },
          }
        : {}),
    },
    depth: 1, // Include related data (countries, categories, companies, organising groups)
    pagination: false,
  })

  // Fetch all filter options
  const [countriesResult, categoriesResult, companiesResult, organisingGroupsResult] =
    await Promise.all([
      payload.find({
        collection: 'countries',
        pagination: false,
        select: {
          name: true,
          id: true,
          isoA2: true,
        },
      }),
      payload.find({
        collection: 'categories',
        pagination: false,
        select: {
          name: true,
          id: true,
          slug: true,
        },
      }),
      payload.find({
        collection: 'companies',
        pagination: false,
        select: {
          name: true,
          id: true,
          slug: true,
        },
      }),
      payload.find({
        collection: 'organisingGroups',
        pagination: false,
        select: {
          name: true,
          id: true,
          slug: true,
        },
      }),
      payload.find({
        collection: 'campaigns',
        pagination: false,
        select: {
          name: true,
          id: true,
          slug: true,
        },
      }),
    ])

  return (
    <EventFilterContextProvider events={eventsResult.docs}>
      <div className="homepage">
        <div className="content-wrapper py-4 bg-white border-b border-gray-200">
          <EventFilter
            countries={countriesResult.docs}
            categories={categoriesResult.docs}
            companies={companiesResult.docs}
            organisingGroups={organisingGroupsResult.docs}
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
            <EventList />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </EventFilterContextProvider>
  )
}
