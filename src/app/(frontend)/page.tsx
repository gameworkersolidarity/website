import { getPayload } from 'payload'

import { EventFilter } from './components/EventFilter'
import { FilteredHomepageContent } from './components/FilteredHomepageContent'
import config from '@/payload.config'
import '@/app/globals.css'
import { draftMode } from 'next/headers'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { EventList } from '@/components/EventList'

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
          slug: true,
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
    <div className="homepage">
      <div className="content-wrapper pb-4">
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
          <div className="flex min-h-[200px] items-center justify-center p-6">
            <span className="font-semibold">One</span>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={60}>
          <div>
            <EventList events={eventsResult.docs} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
