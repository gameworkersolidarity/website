'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import type { Company, Country, Event, OrganisingGroup } from '@/payload-types'
import { notFound } from 'next/navigation'
import { AdminEditBanner } from '@/components/Me'
import chroma from 'chroma-js'
import { twMerge } from 'tailwind-merge'
import { EventFilterContextProvider } from '@/components/EventFilterContextProvider'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { EventList } from '@/components/EventList'
import { projectStrings } from '@/project-strings'
import { CountryLabel } from '@/components/CountryLabel'
import { EventStats } from '@/components/EventStats'
import { EventTimeline } from '@/components/EventsTimeline'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'
import { CompanyLabel } from '@/components/CompanyLabel'

export function CountryPage({
  initialCountry,
  events,
  companies,
  organisingGroups,
}: {
  initialCountry: Country
  events: Event[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
}) {
  if (!initialCountry) notFound()

  // Use the Payload API URL (where the admin panel is hosted)

  const { data: page } = useLivePreview({
    initialData: initialCountry,
    serverURL: projectStrings.baseUrl,
    depth: 2,
  })

  const primaryColor = page.color!
  const textColor = chroma.contrast(primaryColor, chroma('white')) > 4.5 ? 'white' : 'black'

  return (
    <div
      style={{
        backgroundColor: primaryColor,
      }}
    >
      <AdminEditBanner page={page} />
      <article
        className={twMerge(
          'max-w-4xl mx-auto py-5 px-4 flex flex-col gap-4',
          textColor === 'white' && 'text-white',
        )}
      >
        <header>
          <h1 className="text-5xl font-bold font-identity">
            <CountryLabel country={page} />
          </h1>
        </header>
        {page.description && (
          <LexicalRenderer
            content={page.description}
            className={twMerge(textColor === 'white' && 'prose-invert')}
          />
        )}
        {organisingGroups.length > 0 && (
          <div>
            <h2 className="text-xl font-bold font-identity">Organising groups</h2>
            <p className="text-sm opacity-50">Worker organising groups within {page.name}.</p>
            <div className="flex flex-row flex-wrap gap-2 mt-2">
              {organisingGroups.map((organisingGroup) => (
                <div key={organisingGroup.id}>
                  <OrganisingGroupLabel organisingGroup={organisingGroup} link />
                </div>
              ))}
            </div>
          </div>
        )}
        {companies.length > 0 && (
          <div>
            <h2 className="text-xl font-bold font-identity">Companies</h2>
            <p className="text-sm opacity-50">Companies operating in {page.name}.</p>
            <div className="flex flex-row flex-wrap gap-2 mt-2">
              {companies.map((company) => (
                <div key={company.id}>
                  <CompanyLabel company={company as Company} link />
                </div>
              ))}
            </div>
          </div>
        )}
      </article>

      <EventTimeline events={events} labelProperty="categories" />

      <EventFilterContextProvider events={events} overrideFilteredCountryISOA2={page.isoA2}>
        <ResizablePanelGroup direction="horizontal" className="w-full h-screen bg-background">
          <ResizablePanel defaultSize={40}>
            <div className="sticky top-6 h-[calc(100vh-60px)]">
              <EventStats graphs={false} />
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
