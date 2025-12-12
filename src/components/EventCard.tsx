'use client'

import Emoji from 'a11y-react-emoji'
import { getYear } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import pluralize from 'pluralize'
import qs from 'query-string'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { DateTime } from '@/components/DateTime'
import {
  Category,
  Country,
  Event,
  Media,
  OrganisingGroup,
  Company,
  Campaign,
} from '@/payload-types'
import { LexicalRenderer } from '@/app/(frontend)/components/LexicalRenderer'
import { projectStrings } from '@/project-strings'
import { twMerge } from 'tailwind-merge'
import { payloadClient } from '@/utils/payload'
import { CountryLabel } from './CountryLabel'
import { CompanyLabel } from './CompanyLabel'
import { OrganisingGroupLabel } from './OrganisingGroupLabel'
import { CategoryLabel } from './CategoryLabel'
import { EventInitiator } from '@/collections/enums'
import { DisplayInitiator } from '@/utils/displayInitiator'

interface ListProps {
  data: Event[]
  withDialog?: boolean
  gridStyle?: string
  dialogProps?: Partial<DialogProps>
  mini?: boolean
  fullDisplay?: boolean
}

interface DialogProps {
  selectedEvent?: Event
  returnHref?: string
  cardProps?: Partial<CardProps>
  key?: string
}

interface CardProps {
  data: Event
  hoverable?: boolean
  withContext?: boolean
  contextProps?: Partial<ContextProps>
  displayStandaloneInfo?: boolean
  linkStyle?: 'soft' | boolean
}

interface ContextProps {
  subtitle?: string
  url?: string
  name?: any
  metadata?: any
  buttonLabel?: any
}

const DownArrow = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 5L9.11875 4.11875L5.625 7.60625V0H4.375V7.60625L0.8875 4.1125L0 5L5 10L10 5Z"
      fill="#010101"
    />
  </svg>
)

const UpArrow = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 5L0.88125 5.88125L4.375 2.39375L4.375 10H5.625L5.625 2.39375L9.1125 5.8875L10 5L5 0L0 5Z"
      fill="#010101"
    />
  </svg>
)

export function EventsList({
  data: events,
  gridStyle = 'grid-cols-1',
  mini,
  fullDisplay = false,
}: ListProps) {
  const [openYears, setOpenYears] = useState<string[]>([])

  const actionsByYear = useMemo(() => {
    const group = (events || []).reduce(
      (bins, action) => {
        const key = `${getYear(new Date(action.date))}`
        bins[key] ??= []
        bins[key].push(action)
        return bins
      },
      {} as { [key: string]: Event[] },
    )

    return Object.entries(group).sort(([year1, d], [year2, D]) => parseInt(year2) - parseInt(year1))
  }, [events])

  return (
    <>
      <div className={`grid gap-4 ${gridStyle}`}>
        {actionsByYear.map(([yearString, actions], i) => {
          let hiddenActions = [] as Event[]
          let shownActions = [] as Event[]

          let hasHiddenActions = false

          if (actions.length > 3) {
            hasHiddenActions = true
            shownActions = actions.slice(0, 3)
            hiddenActions = actions.slice(3, actions.length)
          } else {
            shownActions = actions
          }

          const hiddenActionsOpen = openYears.includes(yearString)

          const pluralActionsCopy = pluralize('action', hiddenActions.length)

          return (
            <div key={i}>
              <div className="flex flex-row justify-between items-center pb-3">
                <h2
                  className={twMerge(mini ? 'text-lg' : 'text-2xl', 'font-semibold')}
                  id={yearString}
                >
                  {yearString}
                </h2>
                <div className="text-xs font-semibold">
                  {pluralize('action', actions.length, true)}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {shownActions.map((action) => (
                  <Link key={action.id} href={action.path!} shallow>
                    <div className="transition cursor-pointer group" id={action.slug}>
                      {fullDisplay ? (
                        <EventCard data={action} hoverable />
                      ) : (
                        <EventItem data={action} hoverable />
                      )}
                    </div>
                  </Link>
                ))}
                <div className={twMerge(hiddenActionsOpen ? 'flex flex-col gap-4' : 'hidden')}>
                  {hiddenActions.map((action) => (
                    <Link key={action.id} href={action.path!} shallow>
                      <div className="transition cursor-pointer group" id={action.slug}>
                        {fullDisplay ? (
                          <EventCard data={action} hoverable />
                        ) : (
                          <EventItem data={action} hoverable />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              {hasHiddenActions && hiddenActionsOpen === false && (
                <button
                  className="p-3 mt-3 font-semibold text-sm flex items-center"
                  onClick={() => setOpenYears(openYears.concat(openYears, [yearString]))}
                >
                  <>
                    <span className="pr-1">
                      Load {hiddenActions.length} more {pluralActionsCopy}
                    </span>
                    {DownArrow}
                  </>
                </button>
              )}
              {hasHiddenActions && hiddenActionsOpen && (
                <button
                  className="p-3 mt-3 font-semibold text-sm flex items-center"
                  onClick={() =>
                    setOpenYears(openYears.filter((openYear) => openYear !== yearString))
                  }
                >
                  <>
                    <span className="pr-1">
                      Hide {hiddenActions.length} {pluralActionsCopy}
                    </span>
                    {UpArrow}
                  </>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

export function EventItem({ data, hoverable }: { data: Event; hoverable?: boolean }) {
  return (
    <article
      className={twMerge('event-item bg-white rounded-md p-4 text-sm glowable flex flex-col gap-2')}
    >
      <h3 className="text-2xl leading-tight font-semibold max-w-3xl">{data.name}</h3>
      {(!!data.link || !!data.documents?.length) && (
        <div className="flex flex-row mt-3 flex-wrap">
          {data.link && (
            <a href={data.link} className="block my-1 mr-2">
              <Emoji symbol="🔗" label="Link" className="align-baseline" />
              &nbsp;
              <span className="align-baseline underline text-inherit">
                {new URL(data.link).hostname}
              </span>
            </a>
          )}
          {data.documents?.map((doc) => (
            <DocumentLink key={(doc as Media).id} document={doc as unknown as Media} />
          ))}
        </div>
      )}
      <ActionMetadata data={data} />
    </article>
  )
}

export function DocumentLink({
  document,
  withPreview,
}: {
  document: Media
  withPreview?: boolean
}) {
  return (
    <a href={document.url || ''} className="block my-1 mr-2">
      <span className={twMerge(withPreview && 'block')}>
        <Emoji symbol="📑" label="File attachment" className="align-baseline" />
        &nbsp;
        <span className="align-baseline underline text-inherit">{document.filename}</span>
        &nbsp;
        <span className="text-gray-500">{document.mimeType}</span>
      </span>
      {withPreview && (
        <div className="inline-block overflow-hidden border border-black rounded-xl mt-4">
          <Image
            src={document.thumbnailURL || document.url || ''}
            width={document.width || 300}
            height={document.height || 300 * (297 / 210) /** A4 proportional height */}
            alt={document.alt || ''}
          />
        </div>
      )}
    </a>
  )
}

export function ActionMetadata({ data, linkStyle }: { data: Event; linkStyle?: 'soft' | boolean }) {
  return (
    <div className="flex flex-wrap tracking-tight gap-4 gap-y-1">
      <span className="font-semibold">
        <DateTime date={data.date} />
      </span>
      {!!data.countries?.length && (
        <div className="inline-flex flex-wrap gap-2">
          {data.countries.slice(0, 3).map((country) => (
            <CountryLabel
              country={country as Country}
              key={(country as Country).id}
              link={linkStyle}
            />
          ))}
        </div>
      )}
      {data.location ? <span>{data.location}</span> : null}
      {!!data.categories?.length && (
        <div className="inline-flex flex-wrap gap-2">
          {data.categories.slice(0, 3).map((category) => (
            <CategoryLabel
              category={category as unknown as Category}
              key={(category as Category).id}
              link={linkStyle}
            />
          ))}
        </div>
      )}
      {!!data.companies?.length && (
        <div className="inline-flex flex-wrap gap-2">
          {data.companies.slice(0, 3).map((company) => (
            <CompanyLabel
              company={company as Company}
              key={(company as Company).id}
              link={linkStyle}
            />
          ))}
        </div>
      )}
      {!!data.initiator && data.initiator === EventInitiator.BOSS_LED && (
        <div className="inline-flex flex-wrap gap-2">
          <DisplayInitiator initiator={data.initiator as EventInitiator} link={linkStyle} />
        </div>
      )}
      {!!data.organisingGroups?.length && (
        <div className="inline-flex flex-wrap gap-2">
          {data.organisingGroups.slice(0, 3).map((organisingGroup) => (
            <OrganisingGroupLabel
              organisingGroup={organisingGroup as OrganisingGroup}
              key={(organisingGroup as OrganisingGroup).id}
              link={linkStyle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function EventCard({
  data,
  withContext,
  hoverable,
  displayStandaloneInfo = false,
  linkStyle = true,
}: CardProps) {
  return (
    <>
      <article className={twMerge('space-y-2px rounded-xl overflow-hidden')}>
        <div className={twMerge('p-4 lg:px-8 bg-white')}>
          <div className="text-sm">
            <ActionMetadata data={data} linkStyle={linkStyle} />
          </div>
          <div className="pb-4" />
          <h3 className={twMerge('text-3xl leading-tight font-semibold max-w-3xl')}>{data.name}</h3>
          {data.description && (
            <LexicalRenderer
              content={data.description}
              className={'w-full pt-4 text-lg font-light'}
            />
          )}
          <div className="flex flex-row space-x-4 mt-3 text-sm">
            {data.link && (
              <a href={data.link} className="block my-1">
                <Emoji symbol="🔗" label="Link" className="align-baseline" />
                &nbsp;
                <span className="align-baseline underline text-inherit">
                  {new URL(data.link).hostname}
                </span>
              </a>
            )}
          </div>
        </div>
        {!!data.documents && data.documents.length > 0 && (
          <div className="p-4 md:px-8 bg-white text-sm">
            <div className="font-semibold pb-2">Attachments</div>
            <div className="grid gap-4">
              {data.documents?.map((doc) => (
                <DocumentLink
                  key={(doc as Media).id}
                  document={doc as unknown as Media}
                  withPreview
                />
              ))}
            </div>
          </div>
        )}
        {displayStandaloneInfo && (
          <div className="p-4 md:px-8 bg-white mt-[2px]">
            Have more info about this action?{' '}
            <a className="link" href={`mailto:${projectStrings.email}`}>
              Let us know &rarr;
            </a>
          </div>
        )}
        {/* {withContext && (
          <div className="grid gap-[2px] grid-cols-2 mt-[2px]">
            {data.campaigns?.docs?.map((campaign) => (
              <div className="p-4 md:px-8 bg-white" key={(campaign as Campaign).id}>
                <EventRelatedActions
                  subtitle="Campaign"
                  url={(campaign as Campaign).path}
                  name={<span>{(campaign as Campaign).name}</span>}
                />
              </div>
            ))}
            {data.countries?.map((country) => (
              <div className="p-4 md:px-8 bg-white" key={(country as Country).id}>
                <EventCountryRelatedActions isoA2={(country as Country).isoA2} />
              </div>
            ))}
            {data.categories?.map((category) => (
              <div className="p-4 md:px-8 bg-white" key={(category as Category).id}>
                <EventRelatedActions
                  subtitle="Category"
                  url={(category as Category).path}
                  name={
                    <span className="capitalize">
                      <Emoji symbol={(category as Category).emoji || ''} />{' '}
                      {(category as Category).name}
                    </span>
                  }
                />
              </div>
            ))}
            {data.organisingGroups?.map((organisingGroup) => (
              <div className="p-4 md:px-8 bg-white" key={(organisingGroup as OrganisingGroup).id}>
                <EventRelatedActions
                  subtitle="Organising group"
                  url={(organisingGroup as OrganisingGroup).path}
                  name={(organisingGroup as OrganisingGroup).name}
                  buttonLabel={<span>Learn more &rarr;</span>}
                />
              </div>
            ))}
            {data.companies?.map((company) => (
              <div className="p-4 md:px-8 bg-white" key={(company as Company).id}>
                <EventRelatedActions
                  subtitle="Company"
                  url={(company as Company).path}
                  name={<span>{(company as Company).name}</span>}
                />
              </div>
            ))}
          </div>
        )} */}
      </article>
    </>
  )
}

export function EventCountryRelatedActions({ isoA2 }: { isoA2: string }) {
  const eventsForCountryData = useSWR(
    qs.stringifyUrl({
      url: `/api/country-related-actions`,
      query: {
        isoA2: isoA2,
      },
    }),
    () => {
      return payloadClient.find({
        collection: 'events',
        sort: '-date',
        where: {
          countries: {
            in: {
              isoA2: {
                equals: isoA2,
              },
            },
          },
        },
        limit: 1,
      })
    },
    { revalidateOnMount: true },
  )

  const countryData = useSWR(
    qs.stringifyUrl({
      url: `/api/country`,
      query: {
        iso2: isoA2,
      },
    }),
    () => {
      return payloadClient.find({
        collection: 'countries',
        where: {
          isoA2: {
            equals: isoA2,
          },
        },
        limit: 1,
      })
    },
  )

  const eventCount = eventsForCountryData?.data?.totalDocs || 0
  const country = countryData?.data?.docs?.[0]

  return (
    <EventRelatedActions
      subtitle={'Country'}
      url={country?.path}
      name={
        <span>
          <Emoji symbol={country?.emoji || ''} label={`Flag of ${country?.name}`} /> {country?.name}
        </span>
      }
      metadata={eventCount ? pluralize('event', eventCount, true) : undefined}
    />
  )
}

export function EventRelatedActions({ subtitle, url, name, metadata, buttonLabel }: ContextProps) {
  return (
    <Link href={url || '/'} shallow={false}>
      <div className="cursor-pointer group">
        <div className="font-bold">{name || 'More actions'}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        <div className="link mt-1">
          {buttonLabel || <span>{metadata || 'All actions'} &rarr;</span>}
        </div>
      </div>
    </Link>
  )
}
