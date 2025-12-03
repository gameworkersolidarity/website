'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { EventCard } from '@/components/EventCard'
import type { Campaign, Category, Company, Country, Event, OrganisingGroup } from '@/payload-types'
import { LoggedIn, Username } from '@/components/Me'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import { projectStrings } from '@/project-strings'
import { CountryLabel } from '@/components/CountryLabel'
import { DateTime } from '@/components/DateTime'
import { ArrowLeftIcon } from 'lucide-react'
import { CollectionSlug } from 'payload'
import { CategoryLabel } from '@/components/CategoryLabel'
import { CompanyLabel } from '@/components/CompanyLabel'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'
import { CampaignLabel } from '@/components/CampaignLabel'
import { twMerge } from 'tailwind-merge'

export function EventPage({ initialEvent, eventNav }: { initialEvent: Event; eventNav: EventNav }) {
  if (!initialEvent) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const { data: event } = useLivePreview({
    initialData: initialEvent,
    serverURL: projectStrings.baseUrl,
    depth: 2,
  })

  const hasPreviousEvents =
    Object.values({
      ...eventNav?.previousInCountry,
      ...eventNav?.previousInCategory,
      ...eventNav?.previousInCompany,
      ...eventNav?.previousInOrganisingGroup,
      ...eventNav?.previousInCampaign,
    }).filter(Boolean).length > 0

  const hasNextEvents =
    Object.values({
      ...eventNav?.nextInCountry,
      ...eventNav?.nextInCategory,
      ...eventNav?.nextInCompany,
      ...eventNav?.nextInOrganisingGroup,
      ...eventNav?.nextInCampaign,
    }).filter(Boolean).length > 0

  return (
    <div className="bg-gwBackground" style={{ minHeight: '66vh' }}>
      <LoggedIn>
        <div className="flex flex-row items-center justify-between gap-4 bg-snot-300 p-4 text-black font-mono text-sm uppercase">
          <Link href={`/admin/collections/events/${event.id}`}>
            <Button>Edit this page</Button>
          </Link>
          <div>
            Logged in as <Username />
          </div>
        </div>
      </LoggedIn>
      <div className="mx-auto py-5 px-4 grid grid-cols-2 lg:grid-cols-[1fr_3fr_1fr] gap-4">
        <aside className="order-1 lg:order-0 text-right lg:flex flex-col gap-3 items-start rtl">
          {hasPreviousEvents && <div className="text-sm font-semibold mb-2">Previous events</div>}
          {Object.values(eventNav?.previousInCountry ?? {}).map(
            (event) =>
              event &&
              event.countries?.[0] && (
                <EventBreadcrumbNavLink
                  direction="previous"
                  event={event}
                  key={event.id}
                  label="countries"
                />
              ),
          )}
          {Object.values(eventNav?.previousInCategory ?? {}).map(
            (event) =>
              event &&
              event.categories?.[0] && (
                <EventBreadcrumbNavLink
                  direction="previous"
                  event={event}
                  key={event.id}
                  label="categories"
                />
              ),
          )}
          {Object.values(eventNav?.previousInCompany ?? {}).map(
            (event) =>
              event &&
              event.companies?.[0] && (
                <EventBreadcrumbNavLink
                  direction="previous"
                  event={event}
                  key={event.id}
                  label="companies"
                />
              ),
          )}
          {Object.values(eventNav?.previousInOrganisingGroup ?? {}).map(
            (event) =>
              event &&
              event.organisingGroups?.[0] && (
                <EventBreadcrumbNavLink
                  direction="previous"
                  event={event}
                  key={event.id}
                  label="organisingGroups"
                />
              ),
          )}
          {Object.values(eventNav?.previousInCampaign ?? {}).map(
            (event) =>
              event &&
              event.campaigns?.docs?.[0] && (
                <EventBreadcrumbNavLink
                  direction="previous"
                  event={event}
                  key={event.id}
                  label="campaigns"
                />
              ),
          )}
        </aside>
        <main className="col-span-2 lg:col-span-1">
          <EventCard data={event} withContext displayStandaloneInfo />
        </main>
        <aside className="text-left flex flex-col gap-3 order-3">
          {hasNextEvents && <div className="text-sm font-semibold">Next events</div>}
          {Object.values(eventNav?.nextInCountry ?? {}).map(
            (event) =>
              event &&
              event.countries?.[0] && (
                <EventBreadcrumbNavLink
                  direction="next"
                  event={event}
                  key={event.id}
                  label="countries"
                />
              ),
          )}
          {Object.values(eventNav?.nextInCategory ?? {}).map(
            (event) =>
              event &&
              event.categories?.[0] && (
                <EventBreadcrumbNavLink
                  direction="next"
                  event={event}
                  key={event.id}
                  label="categories"
                />
              ),
          )}
          {Object.values(eventNav?.nextInOrganisingGroup ?? {}).map(
            (event) =>
              event &&
              event.organisingGroups?.[0] && (
                <EventBreadcrumbNavLink
                  direction="next"
                  event={event}
                  key={event.id}
                  label="organisingGroups"
                />
              ),
          )}
          {Object.values(eventNav?.nextInCampaign ?? {}).map(
            (event) =>
              event &&
              event.campaigns?.docs?.[0] && (
                <EventBreadcrumbNavLink
                  direction="next"
                  event={event}
                  key={event.id}
                  label="campaigns"
                />
              ),
          )}
        </aside>
      </div>
    </div>
  )
}

function EventBreadcrumbNavLink({
  event,
  label,
  direction,
}: {
  event: Event
  label: CollectionSlug
  direction: 'previous' | 'next'
}) {
  return (
    <Link
      key={event.path!}
      href={event.path!}
      className={twMerge('flex items-center gap-2 hover:bg-snot-200 p-2 rounded-md justify-start')}
    >
      <ArrowLeftIcon
        className={twMerge(
          'w-4 h-4 shrink-0',
          direction === 'previous' ? 'rotate-0' : 'rotate-180',
        )}
      />
      <div className="flex flex-col gap-1">
        {event.date && (
          <span className="font-mono text-xs opacity-60 uppercase">
            <DateTime date={event.date} />
          </span>
        )}
        <div className="text-xs">
          {label === 'countries' ? (
            <CountryLabel country={event.countries?.[0] as Country} />
          ) : label === 'categories' ? (
            <CategoryLabel category={event.categories?.[0] as Category} />
          ) : label === 'companies' ? (
            <CompanyLabel company={event.companies?.[0] as Company} />
          ) : label === 'organisingGroups' ? (
            <OrganisingGroupLabel
              organisingGroup={event.organisingGroups?.[0] as OrganisingGroup}
            />
          ) : label === 'campaigns' ? (
            <CampaignLabel campaign={event.campaigns?.docs?.[0] as Campaign} />
          ) : null}
        </div>
        <div className="text-sm link">{event.name}</div>
      </div>
    </Link>
  )
}

export interface EventNav {
  // Country
  previousInCountry?: {
    [isoA2: string]: Event | null | undefined
  }
  nextInCountry?: {
    [isoA2: string]: Event | null | undefined
  }
  // Category
  previousInCategory?: {
    [category: string]: Event | null | undefined
  }
  nextInCategory?: {
    [category: string]: Event | null | undefined
  }
  // Company
  previousInCompany?: {
    [company: string]: Event | null | undefined
  }
  nextInCompany?: {
    [company: string]: Event | null | undefined
  }
  // Organising Group
  previousInOrganisingGroup?: {
    [organisingGroup: string]: Event | null | undefined
  }
  nextInOrganisingGroup?: {
    [organisingGroup: string]: Event | null | undefined
  }
  // Campaign
  previousInCampaign?: {
    [campaign: string]: Event | null | undefined
  }
  nextInCampaign?: {
    [campaign: string]: Event | null | undefined
  }
}
