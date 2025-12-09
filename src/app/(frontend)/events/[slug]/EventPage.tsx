'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { EventCard } from '@/components/EventCard'
import type {
  Campaign,
  Category,
  Company,
  Config,
  Country,
  Event,
  OrganisingGroup,
} from '@/payload-types'
import { AdminEditBanner } from '@/components/Me'
import Link from 'next/link'
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
import { EventHistogramContext } from '@/components/EventHistogramContext'

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

  const previousRelatedEvents = event.relatedEvents
    ?.filter((relation) => relation.id !== event.id && (relation.event as Event).date < event.date)
    .sort(
      (b, a) =>
        new Date((a.event as Event).date).getTime() - new Date((b.event as Event).date).getTime(),
    )

  const nextRelatedEvents = event.relatedEvents
    ?.filter((relation) => relation.id !== event.id && (relation.event as Event).date > event.date)
    .sort(
      (a, b) =>
        new Date((b.event as Event).date).getTime() - new Date((a.event as Event).date).getTime(),
    )

  return (
    <div className="bg-gwBackground" style={{ minHeight: '66vh' }}>
      <AdminEditBanner page={event} />
      <div className="mx-auto py-5 px-4 grid grid-cols-2 lg:grid-cols-[1fr_3fr_1fr] gap-4">
        <aside className="order-1 lg:order-0 text-right lg:flex flex-col gap-3 items-start rtl">
          {hasPreviousEvents && <div className="text-sm font-semibold mb-2">Past events</div>}
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
          {previousRelatedEvents?.map((relation) => (
            <EventBreadcrumbNavLink
              label={relation.connectionType}
              direction="previous"
              event={relation.event as Event}
              key={relation.id}
              description={relation.description}
            />
          ))}
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
        </aside>
        <main className="col-span-2 lg:col-span-1 flex flex-col gap-4">
          <EventCard data={event} withContext displayStandaloneInfo />
          <EventHistogramContext event={event} />
        </main>
        <aside className="text-left flex flex-col gap-3 order-3">
          {hasNextEvents && <div className="text-sm font-semibold">Future events</div>}
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
          {nextRelatedEvents?.map((relation) => (
            <EventBreadcrumbNavLink
              direction="next"
              event={relation.event as Event}
              key={relation.id}
              label={relation.connectionType}
              description={relation.description}
            />
          ))}
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
        </aside>
      </div>
    </div>
  )
}

function EventBreadcrumbNavLink({
  event,
  label,
  direction,
  description,
}: {
  event: Event
  label:
    | CollectionSlug
    | NonNullable<Config['collections']['events']['relatedEvents']>[0]['connectionType']
  direction: 'previous' | 'next'
  description?: string
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
      <div className="flex flex-col gap-0.5">
        {event.date && (
          <span className="font-mono text-xs opacity-60 uppercase">
            <DateTime date={event.date} />
          </span>
        )}
        <div className="text-sm flex flex-wrap gap-1">
          {label === 'countries' ? (
            event.countries?.map((country) => (
              <CountryLabel country={country as unknown as Country} key={(country as Country).id} />
            ))
          ) : label === 'categories' ? (
            event.categories?.map((category) => (
              <CategoryLabel
                category={category as unknown as Category}
                key={(category as Category).id}
              />
            ))
          ) : label === 'companies' ? (
            event.companies?.map((company) => (
              <CompanyLabel company={company as unknown as Company} key={(company as Company).id} />
            ))
          ) : label === 'organisingGroups' ? (
            event.organisingGroups?.map((organisingGroup) => (
              <OrganisingGroupLabel
                organisingGroup={organisingGroup as unknown as OrganisingGroup}
                key={(organisingGroup as OrganisingGroup).id}
              />
            ))
          ) : label === 'campaigns' ? (
            event.campaigns?.docs?.map((campaign) => (
              <CampaignLabel
                campaign={campaign as unknown as Campaign}
                key={(campaign as Campaign).id}
              />
            ))
          ) : label === 'INDIRECT' ? (
            <div>Indirect connection</div>
          ) : label === 'DIRECT' ? (
            <div>Direct connection</div>
          ) : null}
        </div>
        <div className="text-xs link">{event.name}</div>
        {description && <div className="text-xs opacity-50 italic mt-0.5">{description}</div>}
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
