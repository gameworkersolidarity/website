'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import type { Campaign, Event, Media } from '@/payload-types'
import { notFound } from 'next/navigation'
import { AdminEditBanner } from '@/components/Me'
import { projectStrings } from '@/project-strings'
import Image from 'next/image'
import { EventExplorer } from '../../components/EventExplorer'
import { ZoomLevel } from '@/utils/global-state'
import { EventInitiatorFilter } from '@/collections/enums'
import pluralize from 'pluralize'
import Link from 'next/link'
import { ArrowDownIcon } from 'lucide-react'
import { useMemo } from 'react'
import { format, isSameMonth, isSameYear } from 'date-fns'

const Back = ({ className }: { className?: string }) => (
  <div className={className}>
    <Link
      href="/campaigns"
      className="mb-2 rounded-md px-2 py-1 bg-background/80 hover:bg-snot-400/80 transition-colors duration-300 inline-flex items-center gap-1 w-auto"
    >
      &larr; All campaigns
    </Link>
  </div>
)

export function CampaignPage({ initialCampaign }: { initialCampaign: Campaign }) {
  if (!initialCampaign) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const { data: page } = useLivePreview({
    initialData: initialCampaign,
    serverURL: projectStrings.baseUrl,
    depth: 3,
  })

  const campaign = page as Campaign

  const events = page.events as Event[]

  const earliestEvent = useMemo(() => {
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  }, [events])

  const latestEvent = useMemo(() => {
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }, [events])

  const sameYear = useMemo(() => {
    return isSameYear(earliestEvent.date, latestEvent.date)
  }, [earliestEvent, latestEvent])

  const sameMonth = useMemo(() => {
    return isSameMonth(earliestEvent.date, latestEvent.date)
  }, [earliestEvent, latestEvent])

  return (
    <div>
      <AdminEditBanner page={page} />
      {page.featuredImage && typeof page.featuredImage === 'object' && page.featuredImage?.url ? (
        <div className="relative">
          <Image
            src={(campaign.featuredImage as Media).cloudinary?.secure_url || page.featuredImage.url}
            alt={page.name}
            width={page.featuredImage.width || 1000}
            height={page.featuredImage.height || 1000}
            className="w-full h-auto object-cover z-10 max-h-[66vh]"
          />
          <article className="absolute top-0 left-0 w-full">
            <div className="max-w-5xl mx-auto md:p-5 flex flex-col gap-4 z-20">
              <Back />
            </div>
          </article>
          <article className="max-w-5xl mx-auto md:p-5 flex flex-col gap-4 -mt-8 z-20 relative">
            <section className="bg-white rounded-xl p-4 md:p-6 space-y-4">
              <header>
                <div className="font-mono uppercase text-sm opacity-50 text-center">
                  <span>
                    {format(
                      earliestEvent.date,
                      sameMonth ? 'dd' : sameYear ? 'dd MMM' : 'dd MMM yyyy',
                    )}{' '}
                    &rarr; {format(latestEvent.date, 'dd MMM yyyy')}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-identity text-center">
                  {page.name}
                </h1>
                {/* Count of events */}
                <div
                  className="mt-4 opacity-50 hover:opacity-100 transition-opacity duration-300 text-center cursor-pointer flex items-center justify-center gap-1 font-mono text-sm uppercase"
                  onClick={() => {
                    const eventsElement = document.getElementById('events')
                    if (eventsElement) {
                      eventsElement.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  <span>{pluralize('event', events.length, true)}</span>
                  <ArrowDownIcon className="w-4 h-4 inline-block" />
                </div>
              </header>
              {page.description && (
                <LexicalRenderer content={page.description} className="mt-4 mx-auto" />
              )}
            </section>
          </article>
        </div>
      ) : (
        <article className="max-w-5xl mx-auto md:p-5 flex flex-col gap-4">
          <Back />
          <section className="bg-white rounded-xl p-4 md:p-6 space-y-4">
            <header>
              <div className="font-mono uppercase text-sm opacity-50">Campaign</div>
              <h1 className="text-4xl md:text-5xl font-bold font-identity">{page.name}</h1>
            </header>
            {page.description && <LexicalRenderer content={page.description} />}
          </section>
        </article>
      )}

      <div className="bg-background relative" id="events">
        <EventExplorer
          graphs={false}
          overrideDefaultZoomLevel={ZoomLevel.Timeline}
          eventFilterContextProps={{
            overrideFilteredInitiator: EventInitiatorFilter.ALL,
          }}
          events={events}
          linkStyle="hard"
          timelineBy={page.highlightedEventAttribute || 'categories'}
          eventFilterProps={{
            campaigns: false,
            years: false,
            initiators: false,
          }}
        />
      </div>
    </div>
  )
}
