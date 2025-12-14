'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import type { OrganisingGroup, Event, Company, Country } from '@/payload-types'
import { notFound } from 'next/navigation'
import { AdminEditBanner } from '@/components/Me'
import chroma from 'chroma-js'
import { twMerge } from 'tailwind-merge'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import { projectStrings } from '@/project-strings'
import { Descendants } from '../../components/Descendants'
import { ArchiveBreadcrumb } from '@/utils/payloadTree'
import { CountryLabel } from '@/components/CountryLabel'
import { CompanyLabel } from '@/components/CompanyLabel'
import { EventInitiator, EventInitiatorFilter } from '@/collections/enums'
import { Link2, Users } from 'lucide-react'
import XOutlinedIcon from '@/components/X.com'
import Image from 'next/image'
import { EventExplorer } from '../../components/EventExplorer'
import { ZoomLevel } from '@/utils/global-state'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CollapsibleList, CollapsibleTriggerIcon } from '@/components/CollapsibleList'
import pluralize from 'pluralize'

export function OrganisingGroupPage({
  initialGroup,
  events,
  companies,
  descendants,
  countries,
}: {
  initialGroup: OrganisingGroup
  events: Event[]
  companies: Company[]
  descendants?: ArchiveBreadcrumb[] | null
  countries?: Country[] | null
}) {
  if (!initialGroup) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const { data: page } = useLivePreview({
    initialData: initialGroup,
    serverURL: projectStrings.baseUrl,
    depth: 2,
  })

  const primaryColor = page.color!
  const textColor = chroma.contrast(primaryColor, chroma('white')) > 4.5 ? 'white' : 'black'
  const metadataSectionCount = [
    !!descendants?.length && descendants.length > 1,
    !!companies?.length,
    !!countries?.length,
  ].filter(Boolean).length

  return (
    <div>
      <AdminEditBanner page={page} />
      <div
        style={{
          backgroundColor: primaryColor,
        }}
        className="lg:pt-6"
      >
        <article
          className={twMerge(
            // 'max-w-4xl mx-auto py-5 px-4 flex flex-col gap-4',
            // textColor === 'white' && 'text-white',
            'lg:max-w-4xl mx-auto flex flex-col gap-[2px]',
          )}
        >
          <header
            className={twMerge(
              'bg-white p-4 md:p-6 pb-4! lg:rounded-t-xl',
              page.featuredImage &&
                typeof page.featuredImage === 'object' &&
                page.featuredImage.url &&
                'grid grid-cols-1 md:grid-cols-3 gap-4',
            )}
          >
            <div className="col-span-2">
              <div className="font-mono uppercase text-sm opacity-50 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Organising Group
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-5xl font-bold font-identity">
                    {page.fullName || page.name}
                  </h1>
                  {page.name !== page.fullName && page.name && (
                    <p
                      className={twMerge(
                        'text-base mt-2',
                        textColor === 'white' ? 'text-white/80' : 'opacity-50',
                      )}
                    >
                      Also known as: {page.name}
                    </p>
                  )}
                </div>
                {projectStrings.STORAGE_TYPE === 'cloudinary' &&
                  page.logo &&
                  typeof page.logo === 'object' &&
                  page.logo.url && (
                    <div className="shrink-0">
                      <Image
                        src={page.logo.cloudinary!.secure_url!}
                        alt={page.logo.alt || `${page.fullName || page.name} logo`}
                        width={120}
                        height={120}
                        className="object-contain"
                      />
                    </div>
                  )}
              </div>
            </div>
            {page.featuredImage &&
              typeof page.featuredImage === 'object' &&
              page.featuredImage.url && (
                <div className="mb-4">
                  <Image
                    src={page.featuredImage.url}
                    alt={page.featuredImage.alt || ''}
                    width={1000}
                    height={1000}
                  />
                </div>
              )}
          </header>
          {(page.website || page.twitter || page.bluesky) && (
            <div className="bg-white px-4 md:px-6 py-4 flex flex-col gap-2">
              <h2 className="text-xl font-bold font-identity">Links</h2>
              <OrganisingGroupLinks page={page} />
            </div>
          )}
          {page.description && (
            <LexicalRenderer
              content={page.description}
              className={twMerge(textColor === 'white' && 'prose-invert')}
            />
          )}
          {!!descendants && descendants.length > 1 && (
            <div className="bg-white px-4 md:px-6 py-4">
              <h2 className="text-xl font-bold font-identity">Worker organisation</h2>
              <p className="text-sm opacity-50 mb-1">
                How {page.name} fits into broader worker organisation.
              </p>
              <Descendants breadcrumbs={descendants} initialSelectedItemId={initialGroup.id} />
            </div>
          )}
          {!!countries?.length && countries.length > 0 && (
            <div className="bg-white px-4 md:px-6 py-4">
              <CollapsibleList defaultOpen={countries.length < 15}>
                <CollapsibleTrigger className="flex flex-row items-center gap-1 cursor-pointer">
                  <h2 className="text-xl font-bold font-identity">
                    Active {pluralize('country', countries.length, true)}
                  </h2>
                  <CollapsibleTriggerIcon className="w-4 h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-sm opacity-50">
                    Countries we know this group is organising in.
                  </p>
                  <div className="flex flex-row flex-wrap gap-2 mt-2">
                    {countries.map((country) => (
                      <div key={country.id}>
                        <CountryLabel country={country as Country} link />
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </CollapsibleList>
            </div>
          )}
          {companies?.length > 0 && (
            <div className="bg-white px-4 md:px-6 py-4">
              <CollapsibleList defaultOpen={companies.length < 15}>
                <CollapsibleTrigger className="flex flex-row items-center gap-1 cursor-pointer">
                  <h2 className="text-xl font-bold font-identity">
                    {pluralize('company', companies.length, true)}
                  </h2>
                  <CollapsibleTriggerIcon className="w-4 h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-sm opacity-50">
                    Companies this group organises workers within.
                  </p>
                  <div className="flex flex-row flex-wrap gap-2 mt-2">
                    {companies.map((company) => (
                      <div key={company.id}>
                        <CompanyLabel company={company as Company} link />
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </CollapsibleList>
            </div>
          )}
          <div className="bg-white px-4 md:px-6 py-4 mb-[2px]">
            Have more info about this union?{' '}
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
          overrideFilteredOrganisingGroupSlug: page.slug,
          overrideFilteredInitiator: EventInitiatorFilter.WORKER_LED,
        }}
        events={events}
        primaryColor={primaryColor}
        linkStyle="hard"
        timelineBy="categories"
        eventFilterProps={{
          organisingGroups: false,
          years: false,
          campaigns: false,
          initiators: false,
        }}
      />
    </div>
  )
}

export function OrganisingGroupLinks({ page }: { page: OrganisingGroup }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {page.website && (
        <a
          href={page.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1"
        >
          <Link2 className="w-4 h-4" />
          <span className="align-baseline underline text-inherit link">
            {page.webshiteHostname}
          </span>
        </a>
      )}
      {page.twitter && (
        <a
          href={page.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1"
        >
          <XOutlinedIcon className="h-4 w-4" />
          <span className="align-baseline underline text-inherit link">@{page.twitterHandle}</span>
        </a>
      )}
      {page.bluesky && (
        <a
          href={page.bluesky}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1"
        >
          <svg fill="none" viewBox="0 0 64 57" width="20" className="inline-block text-[#0085ff]">
            <path
              fill="#0085ff"
              d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745Z"
            ></path>
          </svg>
          <span className="align-baseline underline text-inherit link">@{page.blueskyHandle}</span>
        </a>
      )}
    </div>
  )
}
