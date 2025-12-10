'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import chroma from 'chroma-js'
import { twMerge } from 'tailwind-merge'
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable'
import { ResizablePanelGroup } from '@/components/ui/resizable'
import { EventFilterContextProvider } from '@/components/EventFilterContextProvider'
import { EventList } from '@/components/EventList'
import type { Campaign, Event } from '@/payload-types'
import { notFound } from 'next/navigation'
import { AdminEditBanner } from '@/components/Me'
import { projectStrings } from '@/project-strings'
import { getSlug } from '../../../../utils/payloadPath'
import { EventStats } from '@/components/EventStats'
import Image from 'next/image'
import { EventTimeline } from '@/components/EventsTimeline'

export function CampaignPage({ initialCampaign }: { initialCampaign: Campaign }) {
  if (!initialCampaign) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const { data: page } = useLivePreview({
    initialData: initialCampaign,
    serverURL: projectStrings.baseUrl,
    depth: 3,
  })

  const events = page.events as Event[]

  const primaryColor = page.color!
  const textColor = chroma.contrast(primaryColor, chroma('white')) > 4.5 ? 'white' : 'black'

  return (
    <div
      style={{
        backgroundColor: primaryColor,
      }}
    >
      <AdminEditBanner page={page} />
      {page.featuredImage && typeof page.featuredImage === 'object' && page.featuredImage?.url ? (
        <div className="w-full mx-auto grid md:grid-cols-2">
          <div className="flex flex-col gap-4 p-4 md:p-5 lg:p-6 xl:p-8 sticky top-6">
            <header>
              <div className="font-mono uppercase text-sm opacity-50">Campaign</div>
              <h1 className="text-5xl font-bold font-identity">{page.name}</h1>
            </header>
            {page.description && (
              <LexicalRenderer
                content={page.description}
                className={twMerge(textColor === 'white' && 'prose-invert')}
              />
            )}
          </div>
          <Image
            src={page.featuredImage.url}
            alt={page.name}
            width={page.featuredImage.width || 1000}
            height={page.featuredImage.height || 1000}
            className="sticky top-6"
          />
        </div>
      ) : (
        <article
          className={twMerge(
            'max-w-4xl mx-auto py-5 px-4 flex flex-col gap-4',
            textColor === 'white' && 'text-white',
          )}
        >
          <header>
            <div className="font-mono uppercase text-sm opacity-50">Campaign</div>
            <h1 className="text-5xl font-bold font-identity">{page.name}</h1>
          </header>
          {page.description && (
            <LexicalRenderer
              content={page.description}
              className={twMerge(textColor === 'white' && 'prose-invert')}
            />
          )}
        </article>
      )}

      <EventTimeline events={events} />

      <EventFilterContextProvider
        events={events}
        overrideFilteredCampaignSlug={getSlug('campaigns', page)}
      >
        <ResizablePanelGroup direction="horizontal" className="w-full h-screen bg-background">
          <ResizablePanel defaultSize={40}>
            <div className="sticky top-6 h-[calc(100vh-60px)]">
              <EventStats color={primaryColor} />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60}>
            <EventList linkStyle="hard" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </EventFilterContextProvider>
    </div>
  )
}
