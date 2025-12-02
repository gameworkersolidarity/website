import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { Event } from '@/payload-types'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import chroma from 'chroma-js'
import { twMerge } from 'tailwind-merge'
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable'
import { ResizablePanelGroup } from '@/components/ui/resizable'
import { EventFilterContextProvider } from '@/components/EventFilterContextProvider'
import { EventList } from '@/components/EventList'
import { CollectiveActionStats } from '@/app/(frontend)/components/CollectiveActionStats'
// import { EventTimeline } from '@/components/EventsTimeline'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const pagesResult = await payload.find({
    collection: 'campaigns',
    where: {
      _status: {
        equals: 'published',
      },
    },
    pagination: false,
  })

  return pagesResult.docs.map((page) => ({
    slug: page.slug,
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const result = await payload.find({
    collection: 'campaigns',
    where: {
      slug: {
        equals: slug,
      },
      // Only fetch published content when not in draft mode
      ...(!isDraftMode
        ? {
            _status: {
              equals: 'published',
            },
          }
        : {}),
    },
    depth: 0,
    draft: isDraftMode,
    limit: 1,
  })

  if (result.docs.length === 0) {
    return {
      title: 'Not found',
    }
  }

  const page = result.docs[0]
  return {
    title: `${page.name} - Game Workers Solidarity Platform`,
    description: `Learn about ${page.name} and its timeline of solidarity actions.`,
  }
}

export default async function CampaignPage({ params }: { params: { slug: string } }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const result = await payload.find({
    collection: 'campaigns',
    where: {
      slug: {
        equals: slug,
      },
      // Only fetch published content when not in draft mode
      ...(!isDraftMode
        ? {
            _status: {
              equals: 'published',
            },
          }
        : {}),
    },
    depth: 3, // Deep depth to get all event relationships
    draft: isDraftMode,
    limit: 1,
  })

  if (result.docs.length === 0) {
    notFound()
  }

  const page = result.docs[0]
  const events = page.events?.map((event) => event as Event) || []

  const textColor = chroma.contrast(page.primaryColor, chroma('white')) > 4.5 ? 'white' : 'black'

  return (
    <div
      style={{
        backgroundColor: page.primaryColor,
      }}
    >
      <article
        className={twMerge(
          'max-w-4xl mx-auto py-5 px-4 flex flex-col gap-4',
          textColor === 'white' && 'text-white',
        )}
      >
        <h1 className="text-5xl font-bold font-identity">{page.name}</h1>
        {page.description && (
          <div className={twMerge('prose', textColor === 'white' && 'prose-invert')}>
            <LexicalRenderer content={page.description} />
          </div>
        )}
      </article>

      {/* <EventTimeline events={events} /> */}

      <EventFilterContextProvider events={events}>
        <ResizablePanelGroup direction="horizontal" className="w-full h-screen bg-background">
          <ResizablePanel defaultSize={40}>
            <div className="sticky top-6 h-[calc(100vh-60px)]">
              <CollectiveActionStats color={page.primaryColor} />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60}>
            <EventList />
          </ResizablePanel>
        </ResizablePanelGroup>
      </EventFilterContextProvider>
    </div>
  )
}
