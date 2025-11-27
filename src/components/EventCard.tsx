import { Dialog, Transition } from '@headlessui/react'
import Emoji from 'a11y-react-emoji'
import { format, getYear } from 'date-fns'
import { useRouter } from 'next/dist/client/router'
import Image from 'next/image'
import Link from 'next/link'
import pluralize from 'pluralize'
import qs from 'query-string'
import { useContext, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
// import { FilterContext } from '../components/Timeline'
// import { projectStrings } from '../data/site'
// import { actionUrl } from '../data/event'
// import { AirtableCDNMap, Attachment, Country, Event } from '../data/types'
import { usePrevious } from '@/utils/usePrevious'
import { DateTime } from '@/components/DateTime'
import { Event, Media } from '@/payload-types'
import { LexicalRenderer } from '@/app/(frontend)/components/LexicalRenderer'
import { twMerge } from 'tailwind-merge'

interface ListProps {
  data: Event[]
  withDialog?: boolean
  gridStyle?: string
  dialogProps?: Partial<DialogProps>
  mini?: boolean
}

interface DialogProps {
  selectedEvent?: Event
  returnHref?: string
  cardProps?: Partial<CardProps>
  key?: string
}

interface CardProps {
  data: Event
  withContext?: boolean
  contextProps?: Partial<ContextProps>
}

interface ContextProps {
  subtitle?: string
  url?: string
  name?: any
  metadata?: any
  buttonLabel?: any
}

export function EventDialog({ selectedEvent, returnHref, cardProps }: DialogProps) {
  const router = useRouter()

  function onClose() {
    if (returnHref) {
      return router.push(returnHref, returnHref, { shallow: false, scroll: false })
    }
  }

  const showDialog = !!selectedEvent

  return (
    <Transition
      show={showDialog}
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Dialog open={showDialog} onClose={onClose} className="fixed z-40 inset-0 overflow-y-auto">
        {selectedEvent?.fields && (
          <>
            <Dialog.Overlay className="fixed z-10 inset-0 bg-gwOrange opacity-80" />
            <div className="absolute z-20 w-full max-w-4xl top-[1%] left-1/2 transform -translate-x-1/2 py-5 p-4">
              <Dialog.Title className="hidden">{selectedEvent.fields.Name}</Dialog.Title>
              <Dialog.Description className="hidden">
                {selectedEvent.fields.Summary}
              </Dialog.Description>
              <button
                type="button"
                className="mb-3 rounded-xl px-2 py-1 border-box bg-white"
                onClick={onClose}
              >
                &larr; Back
              </button>
              <EventCard data={selectedEvent} {...cardProps} />
            </div>
          </>
        )}
      </Dialog>
    </Transition>
  )
}

export const DEFAULT_ACTION_DIALOG_KEY = 'dialogActionId'

export function useSelectedEvent(events: Event[], key = DEFAULT_ACTION_DIALOG_KEY) {
  const router = useRouter()
  const dialogActionId = router.query[key]
  const selectedEvent = events.find((a) => a.slug === dialogActionId)
  return [selectedEvent, key] as const
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
  withDialog,
  gridStyle = 'grid-cols-1',
  dialogProps,
  mini,
}: ListProps) {
  const { makeContextualHref } = useContextualRouting()
  const [selectedEvent, dialogKey] = useSelectedEvent(events || [], dialogProps?.key)
  const [openYears, setOpenYears] = useState<string[]>([])

  const actionsByYear = useMemo(() => {
    const group = (events || []).reduce(
      (bins, action) => {
        const key = `${getYear(new Date(action.fields.Date))}`
        bins[key] ??= []
        bins[key].push(action)
        return bins
      },
      {} as { [key: string]: Event[] },
    )

    return Object.entries(group).sort(([year1, d], [year2, D]) => parseInt(year2) - parseInt(year1))
  }, [events])

  const router = useRouter()

  // when the router changes, update the current route
  const [currentHref, setCurrentHref] = useState(router.asPath)

  // store the past route and use it as the currentHref
  const lastHref = usePrevious(currentHref)

  useEffect(() => {
    const handleRouteChangeComplete = (url, obj) => {
      setCurrentHref(url)
    }
    router.events.on('routeChangeComplete', handleRouteChangeComplete)
    return () => router.events.off('routeChangeComplete', handleRouteChangeComplete)
  }, [router])

  return (
    <>
      {withDialog && (
        <EventDialog selectedEvent={selectedEvent} returnHref={lastHref || '/'} {...dialogProps} />
      )}
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
                <h2 className={cx(mini ? 'text-lg' : 'text-2xl', 'font-semibold')} id={yearString}>
                  {yearString}
                </h2>
                <div className="text-xs font-semibold">
                  {pluralize('action', actions.length, true)}
                </div>
              </div>
              <div className="space-y-4">
                {shownActions.map((action) => (
                  <Link
                    key={action.id}
                    href={makeContextualHref({ [dialogKey]: action.slug })}
                    as={actionUrl(action)}
                    shallow
                  >
                    <div className="transition cursor-pointer group" id={action.slug}>
                      <EventItem data={action} />
                    </div>
                  </Link>
                ))}
                <div className={cx(hiddenActionsOpen ? 'space-y-4' : 'hidden')}>
                  {hiddenActions.map((action) => (
                    <Link
                      key={action.id}
                      href={makeContextualHref({ [dialogKey]: action.slug })}
                      as={actionUrl(action)}
                      shallow
                    >
                      <div className="transition cursor-pointer group" id={action.slug}>
                        <EventItem data={action} />
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

function groupBy<T>(arr: T[], getGroupKey: (i: T) => string) {
  return arr.reduce(
    (groups, i) => {
      groups[getGroupKey(i)] ??= []
      groups[getGroupKey(i)].push(i)
      return groups
    },
    {} as { [key: string]: T[] },
  )
}

function getChunks(array: Fuse.FuseResultMatch[]) {
  return array.reduce((indicies, d) => {
    return indicies.concat(d.indices.map(([start, end]) => ({ start, end: end + 1 })))
  }, [] as Chunk[])
}

function highlightHTML(html: string, search: string, className: string) {
  return html.replace(
    new RegExp(`(${search})` || '', 'gim'),
    `<mark class='${className}'>$1</mark>`,
  )
}

export function EventItem({ data }: { data: Event }) {
  const { search } = useContext(FilterContext)

  const isFeatured = data.fields.DisplayStyle === 'Featured'

  return (
    <article className={cx('bg-white rounded-xl p-4 text-sm glowable')}>
      <ActionMetadata data={data} />
      <div>
        {isFeatured ? (
          <>
            <h2 className="text-3xl leading-tight font-semibold max-w-3xl mt-3">
              <Highlighter
                highlightClassName="bg-gwYellow"
                searchWords={[search || '']}
                autoEscape={true}
                textToHighlight={data.fields.Name}
              />
            </h2>
            {data.fields.Summary && (
              <div className="w-full pt-4 text-base">
                <div
                  dangerouslySetInnerHTML={{
                    __html: !search
                      ? data.summary.html
                      : highlightHTML(data.summary.html, search, 'bg-gwYellow'),
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <h3 className="text-2xl leading-tight font-semibold max-w-3xl mt-3">
            <Highlighter
              highlightClassName="bg-gwYellow"
              searchWords={[search || '']}
              autoEscape={true}
              textToHighlight={data.fields.Name}
            />
          </h3>
        )}
        <div className="flex flex-row mt-3 flex-wrap">
          {data.fields.Link && (
            <a href={data.fields.Link} className="block my-1 mr-2">
              <Emoji symbol="🔗" label="Link" className="align-baseline" />
              &nbsp;
              <span className="align-baseline underline text-inherit">
                {new URL(data.fields.Link).hostname}
              </span>
            </a>
          )}
          {data.cdnMap.map((doc) => (
            <DocumentLink key={doc.airtableDocID} {...doc} />
          ))}
        </div>
      </div>
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
    <a href={document.url} className="block my-1 mr-2">
      <span className={cx(withPreview && 'block')}>
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

export function ActionMetadata({ data }: { data: Event }) {
  return (
    <div className="flex flex-wrap tracking-tight">
      <span className="font-semibold pr-3">
        <DateTime date={data.date} />
      </span>
      {data.location ? <span className="pr-1">{data.location}</span> : null}
      {data.countries?.map((country) => (
        <span className="pr-3" key={country.id}>
          <Emoji symbol={country.emoji.emoji} label={`Flag of ${country.name}`} className="pr-1" />
          <span>{country.name}</span>
        </span>
      ))}
      {data.categories?.map((category) => (
        <span className="capitalize block pr-3" key={category.id}>
          {category.name}
        </span>
      ))}
      {data.companies?.map((company) => (
        <span className="capitalize block pr-3" key={company.id}>
          {company.name}
        </span>
      ))}
      {data.organisingGroups?.map((organisingGroup) => (
        <span className="capitalize block pr-3" key={organisingGroup.id}>
          {organisingGroup.name}
        </span>
      ))}
    </div>
  )
}

export function EventCard({ data, withContext }: CardProps) {
  return (
    <>
      <article className={twMerge('space-y-2px rounded-xl overflow-hidden')}>
        <div className="p-4 md:px-8 bg-white">
          <div className="text-sm">
            <ActionMetadata data={data} />
          </div>
          <div className="pb-4" />
          <h3 className={cx('text-3xl leading-tight font-semibold max-w-3xl')}>{data.name}</h3>
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
        {data.documents > 0 && (
          <div className="p-4 md:px-8 bg-white text-sm">
            <div className="font-semibold pb-2">Attachments</div>
            <div className="grid gap-4">
              {data.document.map((doc) => (
                <DocumentLink key={doc.id} {...doc} withPreview />
              ))}
            </div>
          </div>
        )}
        <div className="p-4 md:px-8 bg-white">
          Have more info about this action?{' '}
          <a className="link" href={`mailto:${projectStrings.email}`}>
            Let us know &rarr;
          </a>
        </div>
        {withContext && (
          <div className="grid gap-[2px] grid-cols-2">
            {data.fields.countryCode?.map((code) => (
              <div className="p-4 md:px-8 bg-white" key={code}>
                <EventCountryRelatedActions countryCode={code} />
              </div>
            ))}
            {data.fields.CategoryName?.map((categoryName, i) => (
              <div className="p-4 md:px-8 bg-white" key={categoryName}>
                <EventRelatedActions
                  subtitle="Category"
                  url={`/?category=${categoryName}`}
                  name={
                    <span className="capitalize">
                      <Emoji symbol={data.fields.CategoryEmoji![i]} /> {categoryName}
                    </span>
                  }
                />
              </div>
            ))}
            {data.fields['Organising Groups']?.map((organisingGroupId, i) => (
              <div className="p-4 md:px-8 bg-white" key={organisingGroupId}>
                <EventRelatedActions
                  subtitle="Organising group"
                  url={`/group/${organisingGroupId}`}
                  name={data.fields.organisingGroupName![i]}
                  buttonLabel={<span>Learn more &rarr;</span>}
                />
              </div>
            ))}
            {data.fields.companyName?.map((companyName, i) => (
              <div className="p-4 md:px-8 bg-white" key={companyName}>
                <EventRelatedActions
                  subtitle="Company"
                  url={`/?company=${companyName}`}
                  name={<span>{companyName}</span>}
                />
              </div>
            ))}
          </div>
        )}
      </article>
    </>
  )
}

export function EventCountryRelatedActions({ countryCode }: { countryCode }) {
  const { data } = useSWR<Country>(
    qs.stringifyUrl({
      url: `/api/country`,
      query: {
        iso2: countryCode,
      },
    }),
    { revalidateOnMount: true },
  )

  const actionCount = data?.fields?.['Solidarity Actions']?.length || 0

  return (
    <EventRelatedActions
      subtitle={'Country'}
      url={`/?country=${data?.fields?.Slug}`}
      name={
        data?.fields ? (
          <span>
            <Emoji symbol={data?.emoji?.emoji} label="flag" /> {data?.fields.Name}
          </span>
        ) : (
          countryCode
        )
      }
      metadata={actionCount ? pluralize('action', actionCount, true) : undefined}
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
