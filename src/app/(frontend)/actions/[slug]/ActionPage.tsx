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

function getNextBreadcrumbItems(
  actionNav: ActionNav,
  nextRelatedActions: Action['relatedActions'],
): { action: Action; label: BreadcrumbNavLabel; description?: string; key: string }[] {
  const items: { action: Action; label: BreadcrumbNavLabel; description?: string; key: string }[] =
    []

  const add = (action: Action | null | undefined, label: BreadcrumbNavLabel, key: string) => {
    if (action?.date) items.push({ action, label, key })
  }
  Object.values(actionNav?.nextInCampaign ?? {}).forEach((action) => {
    if (action?.campaigns?.docs?.[0]) add(action, 'campaigns', `next-campaign-${action.id}`)
  })
  nextRelatedActions?.forEach((relation) => {
    const action = relation.action as Action
    if (action?.date)
      items.push({
        action,
        label: relation.connectionType,
        description: relation.description,
        key: `next-related-${relation.id}`,
      })
  })
  Object.values(actionNav?.nextInCompany ?? {}).forEach((action) => {
    if (action?.companies?.[0]) add(action, 'companies', `next-company-${action.id}`)
  })
  Object.values(actionNav?.nextInOrganisingGroup ?? {}).forEach((action) => {
    if (action?.organisingGroups?.[0]) add(action, 'organisingGroups', `next-og-${action.id}`)
  })
  Object.values(actionNav?.nextInCountry ?? {}).forEach((action) => {
    if (action?.countries?.[0]) add(action, 'countries', `next-country-${action.id}`)
  })
  Object.values(actionNav?.nextInCategory ?? {}).forEach((action) => {
    if (action?.categories?.[0]) add(action, 'categories', `next-category-${action.id}`)
  })

  return items.sort(
    (a, b) => new Date(a.action.date!).getTime() - new Date(b.action.date!).getTime(),
  )
}

function FollowingActions({
  actionNav,
  nextRelatedActions,
  currentActionDate,
  baseDelay = 0,
}: {
  actionNav: ActionNav
  nextRelatedActions: Action['relatedActions']
  currentActionDate: string
  baseDelay?: number
}) {
  const items = getNextBreadcrumbItems(actionNav, nextRelatedActions)
  return (
    <motion.div className="flex flex-col gap-3" layout transition={layoutTransition}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...layoutTransition, delay: baseDelay }}
      >
        <div className="text-sm text-zinc-500 font-semibold">Following actions</div>
      </motion.div>
      {items.map(({ action, label, description, key }, index) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...layoutTransition, delay: baseDelay + (index + 1) * 0.04 }}
        >
          <ActionBreadcrumbNavLink
            direction="next"
            action={action}
            label={label}
            description={description}
            currentActionDate={currentActionDate}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

function PreviousActions({
  actionNav,
  previousRelatedActions,
  currentActionDate,
  baseDelay = 0,
}: {
  actionNav: ActionNav
  previousRelatedActions: Action['relatedActions']
  currentActionDate: string
  baseDelay?: number
}) {
  const campaignItems = Object.values(actionNav?.previousInCampaign ?? {}).filter(
    (action) => action && action.campaigns?.docs?.[0],
  )
  const relatedItems = previousRelatedActions ?? []
  const companyItems = Object.values(actionNav?.previousInCompany ?? {}).filter(
    (action) => action && action.companies?.[0],
  )
  const ogItems = Object.values(actionNav?.previousInOrganisingGroup ?? {}).filter(
    (action) => action && action.organisingGroups?.[0],
  )
  const countryItems = Object.values(actionNav?.previousInCountry ?? {}).filter(
    (action) => action && action.countries?.[0],
  )
  const categoryItems = Object.values(actionNav?.previousInCategory ?? {}).filter(
    (action) => action && action.categories?.[0],
  )
  const allItems: {
    key: string
    action: Action
    label: BreadcrumbNavLabel
    description?: string
  }[] = [
    ...campaignItems.map((action) => ({
      key: action!.id,
      action: action!,
      label: 'campaigns' as BreadcrumbNavLabel,
    })),
    ...relatedItems.map((relation) => ({
      key: relation.id ?? `related-${(relation.action as Action)?.id}`,
      action: relation.action as Action,
      label: relation.connectionType,
      description: relation.description,
    })),
    ...companyItems.map((action) => ({
      key: action!.id,
      action: action!,
      label: 'companies' as BreadcrumbNavLabel,
    })),
    ...ogItems.map((action) => ({
      key: action!.id,
      action: action!,
      label: 'organisingGroups' as BreadcrumbNavLabel,
    })),
    ...countryItems.map((action) => ({
      key: action!.id,
      action: action!,
      label: 'countries' as BreadcrumbNavLabel,
    })),
    ...categoryItems.map((action) => ({
      key: action!.id,
      action: action!,
      label: 'categories' as BreadcrumbNavLabel,
    })),
  ]

  return (
    <motion.div className="flex flex-col gap-3" layout transition={layoutTransition}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...layoutTransition, delay: baseDelay }}
      >
        <div className="text-sm text-zinc-500 font-semibold mb-2">Previous actions</div>
      </motion.div>
      {allItems.map((item, index) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...layoutTransition, delay: baseDelay + (index + 1) * 0.04 }}
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
            'w-4 h-4 shrink-0',
            direction === 'previous'
              ? 'rotate-0'
              : direction === 'next'
                ? 'rotate-180'
                : 'rotate-270',
          )}
        />
      )}
      <div className="flex flex-col gap-0.5">
        <div
          className={twMerge(
            'text-xs flex flex-wrap ltr items-center text-zinc-400',
            direction === 'previous' ? 'text-right ml-auto justify-end' : 'text-left justify-start',
          )}
        >
          {direction !== 'sameDay' &&
            action.date &&
            (() => {
              const actionDate = new Date(action.date)
              const currentDate = new Date(currentActionDate)
              const distance = formatDistanceStrict(actionDate, currentDate)
              const suffix = direction === 'previous' ? 'before' : 'later'
              return (
                <>
                  {action.categories?.length ? (
                    <span className="flex flex-wrap gap-1">
                      {action.categories?.slice(0, 3).map((category) => (
                        <CategoryLabel
                          category={category as unknown as Category}
                          key={(category as Category).id}
                          className="text-foreground"
                        />
                      ))}
                      &nbsp;
                    </span>
                  ) : null}
                  <time dateTime={action.date}>
                    {distance} {suffix}
                  </time>
                  {label !== 'categories' && <span>&nbsp;in&nbsp;</span>}
                </>
              )
            })()}
          {label === 'countries' ? (
            action.countries
              ?.slice(0, 3)
              .map((country) => (
                <CountryLabel
                  country={country as unknown as Country}
                  key={(country as Country).id}
                  className="text-foreground pr-1"
                />
              ))
          ) : label === 'companies' ? (
            action.companies
              ?.slice(0, 3)
              .map((company) => (
                <CompanyLabel
                  company={company as unknown as Company}
                  key={(company as Company).id}
                  className="text-foreground pr-1"
                />
              ))
          ) : label === 'organisingGroups' ? (
            action.organisingGroups
              ?.slice(0, 3)
              .map((organisingGroup) => (
                <OrganisingGroupLabel
                  organisingGroup={organisingGroup as unknown as OrganisingGroup}
                  key={(organisingGroup as OrganisingGroup).id}
                  className="text-foreground pr-1"
                />
              ))
          ) : label === 'campaigns' ? (
            action.campaigns?.docs
              ?.slice(0, 3)
              .map((campaign) => (
                <CampaignLabel
                  campaign={campaign as unknown as Campaign}
                  key={(campaign as Campaign).id}
                  className="text-foreground pr-1"
                />
              ))
          ) : label === 'INDIRECT' ? (
            <div>Indirect connection</div>
          ) : label === 'DIRECT' ? (
            <div>Direct connection</div>
          ) : null}
        </div>
        <div className="text-base font-medium leading-snug">{action.name}</div>
        {description && <div className="text-xs text-zinc-400 italic mt-0.5">{description}</div>}
        {action.date && direction === 'sameDay' && (
          <span className="text-xs text-zinc-400 ltr text-left">
            <DateTime date={action.date} />
          </span>
        )}
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
}
