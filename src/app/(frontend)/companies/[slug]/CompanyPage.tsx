'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import type { Company, Country, Event, OrganisingGroup } from '@/payload-types'
import { notFound } from 'next/navigation'
import { AdminEditBanner, LoggedIn, Username } from '@/components/Me'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import chroma from 'chroma-js'
import { twMerge } from 'tailwind-merge'
import { EventFilterContextProvider } from '@/components/EventFilterContextProvider'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { EventList } from '@/components/EventList'
import { ArchiveBreadcrumb } from '@/utils/payloadTree'
import { Descendants } from '../../components/Descendants'
import { projectStrings } from '@/project-strings'
import { getSlug } from '@/utils/payloadPath'
import { ExpandableList } from '@/components/ExpandableList'
import { EventStats } from '@/components/EventStats'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'

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
          <div className="font-mono uppercase text-sm opacity-50">Company</div>
          <h1 className="text-5xl font-bold font-identity">{page.name}</h1>
        </header>
        {page.description && (
          <div className={twMerge('prose', textColor === 'white' && 'prose-invert')}>
            <LexicalRenderer content={page.description} />
          </div>
        )}
        {!!descendants && descendants.length > 1 && (
          <div>
            <h2 className="text-xl font-bold font-identity">Company hierarchy</h2>
            <p className="text-sm opacity-50 mb-1">
              How {page.name} fits into the corporate hierarchy.
            </p>
            <Descendants breadcrumbs={descendants} initialSelectedItemId={initialCompany.id} />
          </div>
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
      </article>

      <EventFilterContextProvider
        events={events}
        overrideFilteredCompanySlug={getSlug('companies', page)}
      >
        <ResizablePanelGroup direction="horizontal" className="w-full h-screen bg-background">
          <ResizablePanel defaultSize={40}>
            <div className="sticky top-6 h-[calc(100vh-60px)]">
              <EventStats />
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
