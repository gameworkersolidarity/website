'use client'

import Emoji from 'a11y-react-emoji'
import { getYear } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import pluralize from 'pluralize'
import { useMemo, useState } from 'react'
import { DateTime } from '@/components/DateTime'
import {
  Category,
  Country,
  Action,
  Media,
  OrganisingGroup,
  Company,
  Campaign,
} from '@/payload-types'
import { LexicalRenderer } from '@/app/(frontend)/components/LexicalRenderer'
import { projectStrings } from '@/project-strings'
import { getMediaUrl, getThumbnailUrl } from '@/utils/media'
import { twMerge } from 'tailwind-merge'
import { payloadClient } from '@/utils/payload'
import { CountryLabel } from './CountryLabel'
import { CompanyLabel } from './CompanyLabel'
import { OrganisingGroupLabel } from './OrganisingGroupLabel'
import { CategoryLabel } from './CategoryLabel'
import { ActionInitiatorFilter } from '@/collections/enums'
import { DisplayInitiator } from '@/utils/displayInitiator'
import { CampaignLabel } from './CampaignLabel'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { HighlightText } from './HighlightText'
import { useActionFilterContext } from './ActionFilterContextProvider'
import { DraftBadge } from '@/components/DraftBadge'

// Helper component to highlight search terms in Lexical description
function HighlightedDescription({
  content,
  actionId,
}: {
  content: NonNullable<Action['description']>
  actionId: string
}) {
  const { highlights } = useActionFilterContext()
  const actionHighlights = highlights[actionId]
  const descriptionRanges = actionHighlights?.description

  let plainText: string
  try {
    plainText = lexicalToPlainText(content)
  } catch (e) {
    // Fallback to regular renderer if conversion fails
    return <LexicalRenderer content={content} />
  }

  // Construct JSX outside try/catch to avoid error-boundaries warning
  if (descriptionRanges && descriptionRanges.length > 0) {
    return <HighlightText text={plainText} ranges={descriptionRanges} />
  }
  return <>{plainText}</>
}

interface ListProps {
  data: Action[]
  withDialog?: boolean
  gridStyle?: string
  dialogProps?: Partial<DialogProps>
  mini?: boolean
  fullDisplay?: boolean
}

interface DialogProps {
  selectedAction?: Action
  returnHref?: string
  cardProps?: Partial<CardProps>
  key?: string
}

interface CardProps {
  data: Action
  contextProps?: Partial<ContextProps>
  displayStandaloneInfo?: boolean
  links?: 'soft' | boolean
  searchQuery?: string
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

export function ActionsList({
  data: actions,
  gridStyle = 'grid-cols-1',
  mini,
  fullDisplay = false,
  searchQuery,
}: ListProps & { searchQuery?: string }) {
  const [openYears, setOpenYears] = useState<string[]>([])

  const actionsByYear = useMemo(() => {
    const group = (actions || []).reduce(
      (bins, action) => {
        const key = `${getYear(new Date(action.date))}`
        bins[key] ??= []
        bins[key].push(action)
        return bins
      },
      {} as { [key: string]: Action[] },
    )

    return Object.entries(group).sort(([year1, d], [year2, D]) => parseInt(year2) - parseInt(year1))
  }, [actions])

  return (
    <>
      <div className={`grid gap-4 ${gridStyle}`}>
        {actionsByYear.map(([yearString, actions], i) => {
          let hiddenActions = [] as Action[]
          let shownActions = [] as Action[]

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
                  // <Link key={action.id} href={action.path!} shallow>
                  <div key={action.id} className="transition group" id={action.slug}>
                    {fullDisplay ? (
                      <ActionCard data={action} links={'soft'} searchQuery={searchQuery} />
                    ) : (
                      <ActionItem data={action} links={'soft'} searchQuery={searchQuery} />
                    )}
                  </div>
                  // </Link>
                ))}
                <div className={twMerge(hiddenActionsOpen ? 'flex flex-col gap-4' : 'hidden')}>
                  {hiddenActions.map((action) => (
                    // <Link key={action.id} href={action.path!}>
                    <div key={action.id} className="transition group" id={action.slug}>
                      {fullDisplay ? (
                        <ActionCard data={action} links={'soft'} searchQuery={searchQuery} />
                      ) : (
                        <ActionItem data={action} links={'soft'} searchQuery={searchQuery} />
                      )}
                    </div>
                    // </Link>
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

// Wrapper component for ActionItem - defined outside component to avoid static-components warning
function ActionItemWrapper({ children, href }: { children: React.ReactNode; href?: string }) {
  if (href) {
    return <Link href={href}>{children}</Link>
  }
  return <>{children}</>
}

// Wrapper component for ActionCard - defined outside component to avoid static-components warning
function ActionCardWrapper({
  children,
  href,
  className,
}: {
  children: React.ReactNode
  href?: string
  className?: string
}) {
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }
  return <>{children}</>
}

export function ActionItem({
  data,
  links,
  searchQuery,
}: {
  data: Action
  links?: 'soft' | boolean
  searchQuery?: string
}) {
  const { highlights } = useActionFilterContext()
  const actionHighlights = highlights[data.id]
  const nameRanges = actionHighlights?.name
  const hasDescriptionHighlights =
    actionHighlights?.description && actionHighlights.description.length > 0

  const shouldShowDescription = !!data.description && data.featured

  return (
    <article
      style={{
        // @ts-expect-error - CSS variables are not typed
        '--glow-color':
          data.initiator === ActionInitiatorFilter.BOSS_LED
            ? 'var(--color-gw-orange)'
            : 'var(--color-gw-blue)',
      }}
      className={twMerge(
        'action-item bg-white rounded-md p-4 text-sm glowable flex flex-col gap-2',
        data.initiator === ActionInitiatorFilter.BOSS_LED ? 'glow-gw-orange' : 'glow-gw-blue',
        data.featured && 'outline-2 outline-snot-400 outline-offset-2',
      )}
    >
      <ActionItemWrapper href={links ? data.path : undefined}>
        <h3 className="text-2xl leading-tight font-semibold max-w-3xl">
          <HighlightText text={data.name} ranges={nameRanges} />
        </h3>
        {shouldShowDescription &&
          (() => {
            const description = data.description
            if (!description) return null
            return (
              <div key="description" className={twMerge('w-full text-lg order-2 md:order-2 pt-1')}>
                {hasDescriptionHighlights ? (
                  <HighlightedDescription content={description} actionId={data.id} />
                ) : (
                  <LexicalRenderer content={description} />
                )}
              </div>
            )
          })()}
      </ActionItemWrapper>
      <ActionMetadata data={data} link={links} />
      {(!!data.link || !!data.documents?.length) && (
        <div className="flex flex-row flex-wrap gap-2">
          {data.link && links && (
            <Link href={data.link} className="block mr-2">
              <Emoji symbol="🔗" label="Link" className="align-baseline" />
              &nbsp;
              <span className="align-baseline underline text-inherit">
                {new URL(data.link).hostname}
              </span>
            </Link>
          )}
          {data.documents?.map((doc) => (
            <DocumentLink
              key={(doc as Media).id}
              document={doc as unknown as Media}
              link={!!links}
            />
          ))}
        </div>
      )}
    </article>
  )
}

export function DocumentLink({
  document,
  withPreview,
  link,
}: {
  document: Media
  withPreview?: boolean
  link?: boolean
}) {
  if (link) {
    return (
      <Link href={getMediaUrl(document) || '' || ''} className="block mr-2">
        <RenderDocument />
      </Link>
    )
  } else {
    return <RenderDocument />
  }

  function RenderDocument() {
    return (
      <div className="flex flex-col gap-2">
        {!withPreview && (
          <span className={twMerge(withPreview && 'block')}>
            <Emoji symbol="📑" label="File attachment" className="align-baseline" />
            &nbsp;
            <span className="align-baseline link">
              <span className="align-baseline underline text-inherit">{document.filename}</span>
              &nbsp;
              <span className="text-gray-500">{document.mimeType}</span>
            </span>
          </span>
        )}
        {withPreview && (
          <div className="inline-block overflow-hidden border border-black rounded-xl">
            <Image
              src={getThumbnailUrl(document) || ''}
              width={document.width || 750}
              height={document.height || 750 * (297 / 210) /** A4 proportional height */}
              alt={document.alt || ''}
            />
          </div>
        )}
      </div>
    )
  }
}

export function ActionMetadata({ data, link }: { data: Action; link?: 'soft' | boolean }) {
  return (
    <div className="flex flex-wrap tracking-tight gap-4 gap-y-1">
      {data._status === 'draft' && <DraftBadge />}
      <span className="font-semibold">
        <DateTime date={data.date} />
        {data.endDate && (
          <>
            {' → '}
            <DateTime date={data.endDate} />
          </>
        )}
      </span>
      {data.featured && (
        <div className="inline-flex items-center gap-1 text-xs bg-snot-400 uppercase rounded-md px-1 py-0.5 w-fit font-mono tracking-wide">
          Featured
        </div>
      )}
      {!!data.countries?.length && (
        <div className="inline-flex flex-wrap gap-x-2">
          {data.countries.map((country) => (
            <CountryLabel country={country as Country} key={(country as Country).id} link={link} />
          ))}
        </div>
      )}
      {data.location ? <span>{data.location}</span> : null}
      {!!data.categories?.length && (
        <div className="inline-flex flex-wrap gap-x-2">
          {data.categories.map((category) => (
            <CategoryLabel
              category={category as unknown as Category}
              key={(category as Category).id}
              link={link}
            />
          ))}
        </div>
      )}
      {data.headcount && (
        <span>
          {data.headcount.toLocaleString()} {pluralize('worker', data.headcount)}
        </span>
      )}
      {!!data.companies?.length && (
        <div className="inline-flex flex-wrap gap-x-2">
          {data.companies.map((company) => (
            <CompanyLabel company={company as Company} key={(company as Company).id} link={link} />
          ))}
        </div>
      )}
      {!!data.initiator && data.initiator === ActionInitiatorFilter.BOSS_LED && (
        <div className="inline-flex flex-wrap gap-x-2">
          <DisplayInitiator initiator={data.initiator as ActionInitiatorFilter} link={link} />
        </div>
      )}
      {!!data.organisingGroups?.length && (
        <div className="inline-flex flex-wrap gap-x-2">
          {data.organisingGroups.map((organisingGroup) => (
            <OrganisingGroupLabel
              organisingGroup={organisingGroup as OrganisingGroup}
              key={(organisingGroup as OrganisingGroup).id}
              link={link}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ActionCard({
  data,
  displayStandaloneInfo = false,
  links = true,
  searchQuery,
}: CardProps) {
  const { highlights } = useActionFilterContext()
  const actionHighlights = highlights[data.id]
  const nameRanges = actionHighlights?.name
  const hasDescriptionHighlights =
    actionHighlights?.description && actionHighlights.description.length > 0
  // Use useState initializer to avoid setState in effect warning
  const [isPreviewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.search.includes('previewSecret')
    }
    return false
  })

  const shouldShowDescription = data.description && (isPreviewMode ? data.featured : true)

  return (
    <>
      <article
        className={twMerge(
          'space-y-2px',
          data.featured && 'outline-2 outline-snot-400 outline-offset-2',
        )}
      >
        <main className="bg-white rounded-xl">
          <div className={twMerge('p-4 lg:px-8 flex flex-col gap-4')}>
            <div className="text-sm order-1 md:order-0">
              <ActionMetadata data={data} link={links} />
            </div>
            <ActionCardWrapper
              href={links ? data.path : undefined}
              className={links ? 'block order-0 md:order-1' : undefined}
            >
              {/* Title */}
              <h3 key="title" className={twMerge('text-3xl leading-tight font-semibold max-w-3xl')}>
                <HighlightText text={data.name} ranges={nameRanges} />
              </h3>
            </ActionCardWrapper>
            {/* Description */}
            {shouldShowDescription &&
              (() => {
                const description = data.description
                if (!description) return null
                return (
                  <div key="description" className={twMerge('w-full text-lg order-2 md:order-2')}>
                    {hasDescriptionHighlights ? (
                      <HighlightedDescription content={description} actionId={data.id} />
                    ) : (
                      <LexicalRenderer content={description} />
                    )}
                  </div>
                )
              })()}
            {data.link && links && (
              <div key="links" className="flex flex-row space-x-4 text-sm order-3">
                <Link href={data.link} className="block">
                  <Emoji symbol="🔗" label="Link" className="align-baseline" />
                  &nbsp;
                  <span className="align-baseline text-inherit link">
                    {new URL(data.link).hostname}
                  </span>
                </Link>
              </div>
            )}
          </div>
          {!!data.documents && data.documents.length > 0 && (
            <div className="px-4 lg:px-8 text-sm">
              {/* <div className="text-sm text-zinc-500 font-semibold mb-2">Attachments</div> */}
              <div className="grid gap-4 pb-4 md:pb-5">
                {data.documents?.map((doc) => (
                  <DocumentLink
                    key={(doc as Media).id}
                    document={doc as unknown as Media}
                    withPreview
                    link={!!links}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
        {displayStandaloneInfo && (
          <div className="flex flex-col gap-4 py-4">
            {!!data.campaigns?.docs?.length && (
              <div className="px-4 lg:px-8 text-sm text-zinc-500">
                <span>This report is included in</span>
                {data.campaigns?.docs?.map((campaign) => (
                  <CampaignLabel
                    campaign={campaign as unknown as Campaign}
                    key={(campaign as Campaign).id}
                    link={!!links}
                  />
                ))}
              </div>
            )}
            <div className="px-4 lg:px-8 text-sm text-zinc-500">
              Have more info about this report?{' '}
              <a className="link" href={`mailto:${projectStrings.email}`}>
                Let us know &rarr;
              </a>
            </div>
          </div>
        )}
      </article>
    </>
  )
}
