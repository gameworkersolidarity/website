'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import type { Company, Country, Event, OrganisingGroup } from '@/payload-types'
import { notFound } from 'next/navigation'
import { AdminEditBanner } from '@/components/Me'
import chroma from 'chroma-js'
import { twMerge } from 'tailwind-merge'
import { projectStrings } from '@/project-strings'
import { CountryLabel } from '@/components/CountryLabel'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'
import { CompanyLabel } from '@/components/CompanyLabel'
import { EventExplorer } from '../../components/EventExplorer'
import { ZoomLevel } from '@/utils/global-state'
import { EventInitiatorFilter } from '@/collections/enums'

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
          'max-w-4xl mx-auto md:py-5 px-4 flex flex-col gap-4',
          textColor === 'white' && 'text-white',
        )}
      >
        <header className="sticky top-6 py-4 z-20" style={{ backgroundColor: primaryColor }}>
          <h1 className="text-4xl md:text-5xl font-bold font-identity">
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

      <EventExplorer
        showFilter
        overrideDefaultZoomLevel={ZoomLevel.Timeline}
        eventFilterContextProps={{
          overrideFilteredCountryISOA2: page.isoA2,
          overrideFilteredInitiator: EventInitiatorFilter.ALL,
        }}
        events={events}
        primaryColor={primaryColor}
        linkStyle="hard"
        timelineBy="categories"
        eventFilterProps={{
          countries: false,
          years: false,
          campaigns: false,
          initiators: false,
        }}
      />
    </div>
  )
}
