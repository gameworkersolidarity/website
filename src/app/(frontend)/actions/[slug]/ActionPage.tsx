'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { motion } from 'motion/react'
import { ActionCard } from '@/components/ActionCard'
import type {
  Campaign,
  Category,
  Company,
  Config,
  Country,
  Action,
  OrganisingGroup,
} from '@/payload-types'
import { AdminEditBanner } from '@/components/Me'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { projectStrings } from '@/project-strings'
import { CountryLabel } from '@/components/CountryLabel'
import { DateTime } from '@/components/DateTime'
import { ArrowLeftIcon } from 'lucide-react'
import { formatDistanceStrict } from 'date-fns'
import { CollectionSlug } from 'payload'
import { CategoryLabel } from '@/components/CategoryLabel'
import { CompanyLabel } from '@/components/CompanyLabel'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'
import { CampaignLabel } from '@/components/CampaignLabel'
import { twMerge } from 'tailwind-merge'
import { ActionHistogramContext } from '@/components/ActionHistogramContext'
import { DataPageFooter } from '@/components/DataPageFooter'
import posthog from 'posthog-js'
import { layoutTransition } from '@/lib/motion'
import { getSlug } from '@/utils/payloadPath'

const CARD_ANIMATION_DURATION = 0.5
const TIMELINE_ANIMATION_DELAY = CARD_ANIMATION_DURATION + 0.5

export function ActionPage({
  initialAction,
  actionNav,
}: {
  initialAction: Action
  actionNav: ActionNav
}) {
  if (!initialAction) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const { data: action } = useLivePreview({
    initialData: initialAction,
    serverURL: projectStrings.baseUrl,
    depth: 2,
  })

  const hasPreviousActions =
    Object.values({
      ...actionNav?.previousInCountry,
      ...actionNav?.previousInCategory,
      ...actionNav?.previousInCompany,
      ...actionNav?.previousInOrganisingGroup,
      ...actionNav?.previousInCampaign,
    }).filter(Boolean).length > 0

  const hasNextActions =
    Object.values({
      ...actionNav?.nextInCountry,
      ...actionNav?.nextInCategory,
      ...actionNav?.nextInCompany,
      ...actionNav?.nextInOrganisingGroup,
      ...actionNav?.nextInCampaign,
    }).filter(Boolean).length > 0

  const hasSameDayActions = (actionNav?.sameDay?.length ?? 0) > 0

  const previousRelatedActions = action.relatedActions
    ?.filter(
      (relation) => relation.id !== action.id && (relation.action as Action).date < action.date,
    )
    .sort(
      (b, a) =>
        new Date((a.action as Action).date).getTime() -
        new Date((b.action as Action).date).getTime(),
    )

  const nextRelatedActions = action.relatedActions
    ?.filter(
      (relation) => relation.id !== action.id && (relation.action as Action).date > action.date,
    )
    .sort(
      (a, b) =>
        new Date((b.action as Action).date).getTime() -
        new Date((a.action as Action).date).getTime(),
    )

  return (
    <div className="bg-gwBackground flex-1 flex flex-col" style={{ minHeight: '66vh' }}>
      <AdminEditBanner page={action} />
      <div className="mx-auto py-4 md:py-5 px-4 grid grid-cols-2 lg:grid-cols-[1fr_3fr_1fr] gap-4 mb-auto">
        <aside className="order-1 lg:order-0 text-right lg:flex flex-col gap-3 items-start rtl">
          {hasPreviousActions && (
            <PreviousActions
              actionNav={actionNav}
              previousRelatedActions={previousRelatedActions}
              currentActionDate={action.date}
              baseDelay={CARD_ANIMATION_DURATION}
              extendDividerToEdge="left"
            />
          )}
        </aside>
        <main className="col-span-2 lg:col-span-1 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...layoutTransition, duration: CARD_ANIMATION_DURATION }}
          >
            <ActionCard data={action} links displayStandaloneInfo />
          </motion.div>
          {hasSameDayActions && (
            <SameDayActions
              actions={actionNav}
              currentActionDate={action.date}
              baseDelay={CARD_ANIMATION_DURATION}
            />
          )}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...layoutTransition, delay: TIMELINE_ANIMATION_DELAY }}
          >
            <ActionHistogramContext action={action} />
          </motion.div>
        </main>
        <aside className="text-left flex flex-col gap-3 order-3">
          {hasNextActions && (
            <FollowingActions
              actionNav={actionNav}
              nextRelatedActions={nextRelatedActions}
              currentActionDate={action.date}
              baseDelay={CARD_ANIMATION_DURATION}
              extendDividerToEdge="right"
            />
          )}
        </aside>
      </div>
      <DataPageFooter collection="actions" id={action.id} />
    </div>
  )
}

type BreadcrumbNavLabel =
  | CollectionSlug
  | NonNullable<Config['collections']['actions']['relatedActions']>[0]['connectionType']

const SECTION_ORDER: BreadcrumbNavLabel[] = [
  'organisingGroups',
  'companies',
  'countries',
  'categories',
  'campaigns',
]

type BreadcrumbItem = {
  action: Action
  label: BreadcrumbNavLabel
  description?: string
  key: string
}

function getDisplayName(action: Action, label: BreadcrumbNavLabel): string {
  if (label === 'countries' && action.countries?.[0]) {
    return (action.countries[0] as unknown as Country).name ?? 'Country'
  }
  if (label === 'companies' && action.companies?.[0]) {
    return (action.companies[0] as unknown as Company).name ?? 'Company'
  }
  if (label === 'categories' && action.categories?.[0]) {
    return (action.categories[0] as unknown as Category).name ?? 'Category'
  }
  if (label === 'organisingGroups' && action.organisingGroups?.[0]) {
    return (action.organisingGroups[0] as unknown as OrganisingGroup).name ?? 'Organising group'
  }
  if (label === 'campaigns' && action.campaigns?.docs?.[0]) {
    return (action.campaigns.docs[0] as unknown as Campaign).name ?? 'Campaign'
  }
  return ''
}

/** Resolve display name for the specific entity identified by key (slug), so multiple sections get correct titles. */
function getDisplayNameForKey(action: Action, label: BreadcrumbNavLabel, key: string): string {
  if (label === 'countries') {
    const country = action.countries?.find(
      (c) => getSlug('countries', c as unknown as Country) === key,
    ) as unknown as Country | undefined
    return country?.name ?? key
  }
  if (label === 'companies') {
    const company = action.companies?.find(
      (c) => getSlug('companies', c as unknown as Company) === key,
    ) as unknown as Company | undefined
    return company?.name ?? key
  }
  if (label === 'categories') {
    const category = action.categories?.find(
      (c) => getSlug('categories', c as unknown as Category) === key,
    ) as unknown as Category | undefined
    return category?.name ?? key
  }
  if (label === 'organisingGroups') {
    const og = action.organisingGroups?.find(
      (o) => getSlug('organisingGroups', o as unknown as OrganisingGroup) === key,
    ) as unknown as OrganisingGroup | undefined
    return og?.name ?? key
  }
  if (label === 'campaigns') {
    const campaign = action.campaigns?.docs?.find(
      (c) => getSlug('campaigns', c as unknown as Campaign) === key,
    ) as unknown as Campaign | undefined
    return campaign?.name ?? key
  }
  return key
}

/** Resolve the entity object for the given key so we can render Label components. */
function getEntityForKey(
  action: Action,
  label: BreadcrumbNavLabel,
  key: string,
): Country | Company | Category | OrganisingGroup | Campaign | undefined {
  if (label === 'countries') {
    return action.countries?.find(
      (c) => getSlug('countries', c as unknown as Country) === key,
    ) as unknown as Country | undefined
  }
  if (label === 'companies') {
    return action.companies?.find(
      (c) => getSlug('companies', c as unknown as Company) === key,
    ) as unknown as Company | undefined
  }
  if (label === 'categories') {
    return action.categories?.find(
      (c) => getSlug('categories', c as unknown as Category) === key,
    ) as unknown as Category | undefined
  }
  if (label === 'organisingGroups') {
    return action.organisingGroups?.find(
      (o) => getSlug('organisingGroups', o as unknown as OrganisingGroup) === key,
    ) as unknown as OrganisingGroup | undefined
  }
  if (label === 'campaigns') {
    return action.campaigns?.docs?.find(
      (c) => getSlug('campaigns', c as unknown as Campaign) === key,
    ) as unknown as Campaign | undefined
  }
  return undefined
}

function getSectionTitle(label: BreadcrumbNavLabel, displayName: string): string {
  if (label === 'countries') return `In ${displayName}`
  if (label === 'companies') return `In ${displayName}`
  if (label === 'organisingGroups') return `Organised by ${displayName}`
  if (label === 'categories') return `${displayName} action`
  if (label === 'campaigns') return displayName
  return displayName || 'Related'
}

function SectionHeader({
  section,
  direction,
  actionNav,
}: {
  section: BreadcrumbSection
  direction: 'previous' | 'next'
  actionNav?: ActionNav
}) {
  const prefix =
    section.label === 'categories'
      ? direction === 'previous'
        ? 'Previous '
        : 'Next '
      : direction === 'previous'
        ? 'Previously '
        : 'Next '
  const alignClass = direction === 'previous' ? 'text-right' : 'text-left'
  const className = `text-sm text-zinc-500 font-semibold ltr w-full ${alignClass}`

  const action = section.items[0]?.action
  const facets =
    action && actionNav
      ? (direction === 'previous' ? actionNav.previousFacets : actionNav.nextFacets)?.[action.id]
      : undefined

  const parts: React.ReactNode[] = [prefix]

  if (section.displayName === 'Related') {
    parts.push('related')
    return (
      <span className={className} dir="ltr">
        {parts}
      </span>
    )
  }

  if (facets && action) {
    const wrap = (key: string, children: React.ReactNode) => (
      <span key={key} className="inline-flex items-baseline gap-1">
        {children}
      </span>
    )
    if (facets.organisingGroups?.length) {
      const entity = getEntityForKey(action, 'organisingGroups', facets.organisingGroups[0]) as
        | OrganisingGroup
        | undefined
      if (entity) {
        parts.push(
          'organised by ',
          wrap(
            'og',
            <OrganisingGroupLabel organisingGroup={entity} link className="text-zinc-500" />,
          ),
        )
      }
    }
    if (facets.companies?.length) {
      const entity = getEntityForKey(action, 'companies', facets.companies[0]) as
        | Company
        | undefined
      if (entity) {
        parts.push(
          parts.length > 1 ? ' in ' : 'in ',
          wrap('co', <CompanyLabel company={entity} link className="text-zinc-500" />),
        )
      }
    }
    if (facets.countries?.length) {
      const entity = getEntityForKey(action, 'countries', facets.countries[0]) as
        | Country
        | undefined
      if (entity) {
        parts.push(
          parts.length > 1 ? ' in ' : 'in ',
          wrap('country', <CountryLabel country={entity} link className="text-zinc-500" />),
        )
      }
    }
    if (facets.categories?.length) {
      const entity = getEntityForKey(action, 'categories', facets.categories[0]) as
        | Category
        | undefined
      if (entity) {
        parts.push(
          ' ',
          wrap('cat', <CategoryLabel category={entity} link className="text-zinc-500" />),
        )
      }
    }
    if (facets.campaigns?.length) {
      const entity = getEntityForKey(action, 'campaigns', facets.campaigns[0]) as
        | Campaign
        | undefined
      if (entity) {
        parts.push(
          parts.length > 1 ? ' ' : '',
          wrap('camp', <CampaignLabel campaign={entity} link className="text-zinc-500" />),
        )
      }
    }
    if (parts.length > 1) {
      return (
        <span className={className} dir="ltr">
          {parts}
        </span>
      )
    }
  }

  if (section.entity) {
    const wrap = (key: string, children: React.ReactNode) => (
      <span key={key} className="inline-flex items-baseline gap-1">
        {children}
      </span>
    )
    if (section.label === 'countries') {
      parts.push(
        'in ',
        wrap(
          'c',
          <CountryLabel country={section.entity as Country} link className="text-zinc-500" />,
        ),
      )
    } else if (section.label === 'companies') {
      parts.push(
        'in ',
        wrap(
          'c',
          <CompanyLabel company={section.entity as Company} link className="text-zinc-500" />,
        ),
      )
    } else if (section.label === 'categories') {
      parts.push(
        wrap(
          'c',
          <CategoryLabel category={section.entity as Category} link className="text-zinc-500" />,
        ),
      )
    } else if (section.label === 'organisingGroups') {
      parts.push(
        'organised by ',
        wrap(
          'og',
          <OrganisingGroupLabel
            organisingGroup={section.entity as OrganisingGroup}
            link
            className="text-zinc-500"
          />,
        ),
      )
    } else if (section.label === 'campaigns') {
      parts.push(
        wrap(
          'c',
          <CampaignLabel campaign={section.entity as Campaign} link className="text-zinc-500" />,
        ),
      )
    }
    if (parts.length > 1) {
      return (
        <span className={className} dir="ltr">
          {parts}
        </span>
      )
    }
  }

  const title = getSectionTitle(section.label, section.displayName)
  const normalizedTitle = title.startsWith('In ') ? 'in ' + title.slice(3) : title
  parts.push(normalizedTitle)
  return (
    <span className={className} dir="ltr">
      {parts}
    </span>
  )
}

type BreadcrumbSection = {
  label: BreadcrumbNavLabel
  displayName: string
  items: BreadcrumbItem[]
  /** When set, section header uses the label component (CountryLabel, etc.) instead of raw text */
  entity?: Country | Company | Category | OrganisingGroup | Campaign
}

function getPreviousSections(
  actionNav: ActionNav,
  previousRelatedActions: Action['relatedActions'],
): BreadcrumbSection[] {
  const sections: BreadcrumbSection[] = []

  const pushSection = (label: BreadcrumbNavLabel, items: BreadcrumbItem[], key?: string) => {
    if (items.length === 0) return
    const displayName =
      key != null
        ? getDisplayNameForKey(items[0].action, label, key)
        : getDisplayName(items[0].action, label)
    const entity = key != null ? getEntityForKey(items[0].action, label, key) : undefined
    sections.push({
      label,
      displayName,
      items,
      entity,
    })
  }

  for (const label of SECTION_ORDER) {
    if (label === 'countries') {
      for (const [key, action] of Object.entries(actionNav?.previousInCountry ?? {})) {
        if (action?.countries?.[0]) {
          pushSection(
            'countries',
            [
              {
                action,
                label: 'countries' as BreadcrumbNavLabel,
                key: `prev-country-${key}-${action.id}`,
              },
            ],
            key,
          )
        }
      }
    } else if (label === 'companies') {
      for (const [key, action] of Object.entries(actionNav?.previousInCompany ?? {})) {
        if (action?.companies?.[0]) {
          pushSection(
            'companies',
            [
              {
                action,
                label: 'companies' as BreadcrumbNavLabel,
                key: `prev-company-${key}-${action.id}`,
              },
            ],
            key,
          )
        }
      }
    } else if (label === 'categories') {
      for (const [key, action] of Object.entries(actionNav?.previousInCategory ?? {})) {
        if (action?.categories?.[0]) {
          pushSection(
            'categories',
            [
              {
                action,
                label: 'categories' as BreadcrumbNavLabel,
                key: `prev-category-${key}-${action.id}`,
              },
            ],
            key,
          )
        }
      }
    } else if (label === 'organisingGroups') {
      for (const [key, action] of Object.entries(actionNav?.previousInOrganisingGroup ?? {})) {
        if (action?.organisingGroups?.[0]) {
          pushSection(
            'organisingGroups',
            [
              {
                action,
                label: 'organisingGroups' as BreadcrumbNavLabel,
                key: `prev-og-${key}-${action.id}`,
              },
            ],
            key,
          )
        }
      }
    } else if (label === 'campaigns') {
      for (const [key, action] of Object.entries(actionNav?.previousInCampaign ?? {})) {
        if (action?.campaigns?.docs?.[0]) {
          pushSection(
            'campaigns',
            [
              {
                action,
                label: 'campaigns' as BreadcrumbNavLabel,
                key: `prev-campaign-${key}-${action.id}`,
              },
            ],
            key,
          )
        }
      }
    }
  }

  const relatedItems = (previousRelatedActions ?? []).map((relation) => ({
    action: relation.action as Action,
    label: relation.connectionType as BreadcrumbNavLabel,
    description: relation.description,
    key: `prev-related-${relation.id ?? (relation.action as Action)?.id}`,
  }))
  if (relatedItems.length > 0) {
    sections.push({
      label: 'countries' as BreadcrumbNavLabel,
      displayName: 'Related',
      items: relatedItems,
    })
  }

  return sections
}

function getNextSections(
  actionNav: ActionNav,
  nextRelatedActions: Action['relatedActions'],
): BreadcrumbSection[] {
  const sections: BreadcrumbSection[] = []

  const pushSection = (label: BreadcrumbNavLabel, items: BreadcrumbItem[], key?: string) => {
    if (items.length === 0) return
    const displayName =
      key != null
        ? getDisplayNameForKey(items[0].action, label, key)
        : getDisplayName(items[0].action, label)
    const entity = key != null ? getEntityForKey(items[0].action, label, key) : undefined
    sections.push({
      label,
      displayName,
      items,
      entity,
    })
  }

  for (const label of SECTION_ORDER) {
    if (label === 'countries') {
      for (const [key, action] of Object.entries(actionNav?.nextInCountry ?? {})) {
        if (action?.countries?.[0]) {
          pushSection(
            'countries',
            [
              {
                action,
                label: 'countries' as BreadcrumbNavLabel,
                key: `next-country-${key}-${action.id}`,
              },
            ],
            key,
          )
        }
      }
    } else if (label === 'companies') {
      for (const [key, action] of Object.entries(actionNav?.nextInCompany ?? {})) {
        if (action?.companies?.[0]) {
          pushSection(
            'companies',
            [
              {
                action,
                label: 'companies' as BreadcrumbNavLabel,
                key: `next-company-${key}-${action.id}`,
              },
            ],
            key,
          )
        }
      }
    } else if (label === 'categories') {
      for (const [key, action] of Object.entries(actionNav?.nextInCategory ?? {})) {
        if (action?.categories?.[0]) {
          pushSection(
            'categories',
            [
              {
                action,
                label: 'categories' as BreadcrumbNavLabel,
                key: `next-category-${key}-${action.id}`,
              },
            ],
            key,
          )
        }
      }
    } else if (label === 'organisingGroups') {
      for (const [key, action] of Object.entries(actionNav?.nextInOrganisingGroup ?? {})) {
        if (action?.organisingGroups?.[0]) {
          pushSection(
            'organisingGroups',
            [
              {
                action,
                label: 'organisingGroups' as BreadcrumbNavLabel,
                key: `next-og-${key}-${action.id}`,
              },
            ],
            key,
          )
        }
      }
    } else if (label === 'campaigns') {
      for (const [key, action] of Object.entries(actionNav?.nextInCampaign ?? {})) {
        if (action?.campaigns?.docs?.[0]) {
          pushSection(
            'campaigns',
            [
              {
                action,
                label: 'campaigns' as BreadcrumbNavLabel,
                key: `next-campaign-${key}-${action.id}`,
              },
            ],
            key,
          )
        }
      }
    }
  }

  const relatedItems = (nextRelatedActions ?? []).map((relation) => ({
    action: relation.action as Action,
    label: relation.connectionType as BreadcrumbNavLabel,
    description: relation.description,
    key: `next-related-${relation.id ?? (relation.action as Action)?.id}`,
  }))
  if (relatedItems.length > 0) {
    sections.push({
      label: 'countries',
      displayName: 'Related',
      items: relatedItems,
    })
  }

  return sections
}

function FollowingActions({
  actionNav,
  nextRelatedActions,
  currentActionDate,
  baseDelay = 0,
  extendDividerToEdge,
}: {
  actionNav: ActionNav
  nextRelatedActions: Action['relatedActions']
  currentActionDate: string
  baseDelay?: number
  extendDividerToEdge?: 'left' | 'right'
}) {
  const sections = getNextSections(actionNav, nextRelatedActions)
  const dividerClass =
    extendDividerToEdge === 'left'
      ? 'border-t border-zinc-200 dark:border-zinc-700 my-3 -ml-4 w-[calc(100%+1rem)]'
      : extendDividerToEdge === 'right'
        ? 'border-t border-zinc-200 dark:border-zinc-700 my-3 -mr-4 w-[calc(100%+1rem)]'
        : 'border-t border-zinc-200 dark:border-zinc-700 w-full my-3'

  return (
    <motion.div className="flex flex-col gap-0 w-full" layout transition={layoutTransition}>
      {sections.map((section, sectionIndex) => (
        <div key={`${section.label}-${section.displayName}-${sectionIndex}`} className="w-full">
          {sectionIndex > 0 && <hr className={dividerClass} />}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...layoutTransition, delay: baseDelay }}
            className="mb-2"
          >
            <SectionHeader section={section} direction="next" actionNav={actionNav} />
          </motion.div>
          <div className="flex flex-col gap-1">
            {section.items.map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...layoutTransition,
                  delay: baseDelay + (sectionIndex + index + 1) * 0.04,
                }}
              >
                <ActionBreadcrumbNavLink
                  direction="next"
                  action={item.action}
                  label={item.label}
                  description={item.description}
                  currentActionDate={currentActionDate}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  )
}

function PreviousActions({
  actionNav,
  previousRelatedActions,
  currentActionDate,
  baseDelay = 0,
  extendDividerToEdge,
}: {
  actionNav: ActionNav
  previousRelatedActions: Action['relatedActions']
  currentActionDate: string
  baseDelay?: number
  extendDividerToEdge?: 'left' | 'right'
}) {
  const sections = getPreviousSections(actionNav, previousRelatedActions)
  const dividerClass =
    extendDividerToEdge === 'left'
      ? 'border-t border-zinc-200 dark:border-zinc-700 my-3 -ml-4 w-[calc(100%+1rem)]'
      : extendDividerToEdge === 'right'
        ? 'border-t border-zinc-200 dark:border-zinc-700 my-3 -mr-4 w-[calc(100%+1rem)]'
        : 'border-t border-zinc-200 dark:border-zinc-700 w-full my-3'

  return (
    <motion.div className="flex flex-col gap-0 w-full" layout transition={layoutTransition}>
      {sections.map((section, sectionIndex) => (
        <div key={`${section.label}-${section.displayName}-${sectionIndex}`} className="w-full">
          {sectionIndex > 0 && <hr className={dividerClass} />}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...layoutTransition, delay: baseDelay }}
            className="mb-2"
          >
            <SectionHeader section={section} direction="previous" actionNav={actionNav} />
          </motion.div>
          <div className="flex flex-col gap-1">
            {section.items.map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...layoutTransition,
                  delay: baseDelay + (sectionIndex + index + 1) * 0.04,
                }}
              >
                <ActionBreadcrumbNavLink
                  label={item.label}
                  direction="previous"
                  action={item.action}
                  description={item.description}
                  currentActionDate={currentActionDate}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  )
}
function SameDayActions({
  actions,
  currentActionDate,
  baseDelay = 0,
}: {
  actions: ActionNav
  currentActionDate: string
  baseDelay?: number
}) {
  return (
    <div className="flex flex-col gap-2">
      {actions?.sameDay && actions.sameDay.length > 0 && (
        <div className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...layoutTransition, delay: baseDelay }}
          >
            <h3 className="text-sm text-zinc-500 font-semibold mb-2">Also on this day</h3>
          </motion.div>
          <motion.div
            className="-mx-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 items-start"
            layout="preserve-aspect"
            transition={layoutTransition}
          >
            {actions.sameDay.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...layoutTransition, delay: baseDelay + (index + 1) * 0.04 }}
              >
                <ActionBreadcrumbNavLink
                  direction="sameDay"
                  action={action}
                  label="countries"
                  currentActionDate={currentActionDate}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}

export function ActionBreadcrumbNavLink({
  action,
  label,
  direction,
  description,
  currentActionDate,
}: {
  action: Action
  label:
    | CollectionSlug
    | NonNullable<Config['collections']['actions']['relatedActions']>[0]['connectionType']
  direction: 'previous' | 'next' | 'sameDay'
  description?: string
  currentActionDate: string
}) {
  const handleClick = () => {
    posthog.capture('related_action_clicked', {
      direction,
      relation_type: label,
      target_action_name: action.name,
      target_action_date: action.date,
      target_action_path: action.path,
    })
  }

  return (
    <Link
      key={action.path!}
      href={action.path!}
      onClick={handleClick}
      className={twMerge('flex items-center gap-2 hover:bg-snot-200 p-2 rounded-md justify-start')}
    >
      {direction !== 'sameDay' && (
        <ArrowLeftIcon
          className={twMerge(
            'shrink-0 size-4',
            direction === 'previous'
              ? 'rotate-0'
              : direction === 'next'
                ? 'rotate-180'
                : 'rotate-270',
          )}
          aria-hidden
        />
      )}
      <div
        className={twMerge(
          'flex flex-col gap-0.5 min-w-0 ltr',
          direction === 'previous' ? 'text-right' : 'text-left',
        )}
      >
        {direction !== 'sameDay' && action.date && (
          <div className="text-xs text-zinc-400" dir="ltr">
            {(() => {
              const actionDate = new Date(action.date)
              const currentDate = new Date(currentActionDate)
              const distance = formatDistanceStrict(actionDate, currentDate)
              const suffix = direction === 'previous' ? 'before' : 'later'
              return (
                <time dateTime={action.date}>
                  {distance} {suffix}
                </time>
              )
            })()}
          </div>
        )}
        {action.date && direction === 'sameDay' && (
          <span className="text-xs text-zinc-400 ltr text-left">
            <DateTime date={action.date} />
          </span>
        )}
        <div className="text-base font-medium leading-snug">{action.name}</div>
      </div>
    </Link>
  )
}

export interface ActionNav {
  sameDay: Action[]
  // Country
  previousInCountry?: {
    [isoA2: string]: Action | null | undefined
  }
  nextInCountry?: {
    [isoA2: string]: Action | null | undefined
  }
  // Category
  previousInCategory?: {
    [category: string]: Action | null | undefined
  }
  nextInCategory?: {
    [category: string]: Action | null | undefined
  }
  // Company
  previousInCompany?: {
    [company: string]: Action | null | undefined
  }
  nextInCompany?: {
    [company: string]: Action | null | undefined
  }
  // Organising Group
  previousInOrganisingGroup?: {
    [organisingGroup: string]: Action | null | undefined
  }
  nextInOrganisingGroup?: {
    [organisingGroup: string]: Action | null | undefined
  }
  // Campaign
  previousInCampaign?: {
    [campaign: string]: Action | null | undefined
  }
  nextInCampaign?: {
    [campaign: string]: Action | null | undefined
  }
  /** Facets by which each action is relevant (for deduped multi-facet section headers) */
  previousFacets?: Record<
    string,
    {
      organisingGroups: string[]
      companies: string[]
      countries: string[]
      categories: string[]
      campaigns: string[]
    }
  >
  nextFacets?: Record<
    string,
    {
      organisingGroups: string[]
      companies: string[]
      countries: string[]
      categories: string[]
      campaigns: string[]
    }
  >
}
