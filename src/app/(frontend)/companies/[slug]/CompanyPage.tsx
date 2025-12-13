'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import type { Company, Country, Event, OrganisingGroup } from '@/payload-types'
import { notFound } from 'next/navigation'
import { AdminEditBanner } from '@/components/Me'
import chroma from 'chroma-js'
import { twMerge } from 'tailwind-merge'
import { ArchiveBreadcrumb } from '@/utils/payloadTree'
import { Descendants } from '../../components/Descendants'
import { projectStrings } from '@/project-strings'
import { getSlug } from '@/utils/payloadPath'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'
import { Building } from 'lucide-react'
import { CountryLabel } from '@/components/CountryLabel'
import { EventExplorer } from '../../components/EventExplorer'
import { ZoomLevel } from '@/utils/global-state'
import { EventInitiatorFilter } from '@/collections/enums'

export function CompanyPage({
  initialCompany,
  descendants,
  events,
  organisingGroups,
  countries,
}: {
  initialCompany: Company
  descendants: ArchiveBreadcrumb[] | null
  events: Event[]
  organisingGroups: OrganisingGroup[]
  countries: Country[]
}) {
  if (!initialCompany) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const { data: page } = useLivePreview({
    initialData: initialCompany,
    serverURL: projectStrings.baseUrl,
    depth: 2,
  })

  const primaryColor = page.color!
  const textColor = chroma.contrast(primaryColor, chroma('white')) > 4.5 ? 'white' : 'black'

  return (
    <div>
      <AdminEditBanner page={page} />
      <div
        style={{
          backgroundColor: primaryColor,
        }}
        className="lg:pt-6"
      >
        <article className={twMerge('lg:max-w-4xl mx-auto flex flex-col gap-[2px]')}>
          <header className="bg-white p-4 md:p-6 pb-4! lg:rounded-t-xl">
            <div className="font-mono uppercase text-sm opacity-50 flex items-center gap-1">
              <Building className="w-4 h-4" />
              Company
            </div>
            <h1 className="text-5xl font-bold font-identity">{page.name}</h1>
            {page.description && (
              <LexicalRenderer
                content={page.description}
                className={twMerge(textColor === 'white' && 'prose-invert')}
              />
            )}
          </header>
          {!!descendants && descendants.length > 1 && (
            <div className="bg-white px-4 md:px-6 py-4">
              <h2 className="text-xl font-bold font-identity">Company hierarchy</h2>
              <p className="text-sm opacity-50 mb-1">
                How {page.name} fits into the corporate hierarchy.
              </p>
              <Descendants breadcrumbs={descendants} initialSelectedItemId={initialCompany.id} />
            </div>
          )}
          {organisingGroups.length > 0 && (
            <div className="bg-white px-4 md:px-6 py-4">
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
          {countries.length > 0 && (
            <div className="bg-white px-4 md:px-6 py-4">
              <h2 className="text-xl font-bold font-identity">Active countries</h2>
              <p className="text-sm opacity-50">Countries we know this company is operating in.</p>
              <div className="flex flex-row flex-wrap gap-2 mt-2">
                {countries.map((country) => (
                  <div key={country.id}>
                    <CountryLabel country={country as Country} link />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white px-4 md:px-6 py-4 mb-[2px]">
            Have more info about worker organising in this company?{' '}
            <a href={`mailto:${projectStrings.email}`} className="link">
              Let us know →
            </a>
          </div>
        </article>
      </div>

      <EventExplorer
        showFilter
        overrideDefaultZoomLevel={ZoomLevel.Timeline}
        eventFilterContextProps={{
          overrideFilteredCompanySlug: getSlug('companies', page),
          overrideFilteredInitiator: EventInitiatorFilter.ALL,
        }}
        events={events}
        primaryColor={primaryColor}
        linkStyle="hard"
        timelineBy="categories"
        eventFilterProps={{
          companies: false,
          years: false,
          campaigns: false,
          initiators: false,
        }}
      />
    </div>
  )
}
