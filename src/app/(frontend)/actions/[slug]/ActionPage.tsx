'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
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
import { CollectionSlug } from 'payload'
import { CategoryLabel } from '@/components/CategoryLabel'
import { CompanyLabel } from '@/components/CompanyLabel'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'
import { CampaignLabel } from '@/components/CampaignLabel'
import { twMerge } from 'tailwind-merge'
import { ActionHistogramContext } from '@/components/ActionHistogramContext'

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

  const hasSameDayActions =
    Object.values({
      ...actionNav?.sameDayInCountry,
      ...actionNav?.sameDayInCategory,
      ...actionNav?.sameDayInCompany,
      ...actionNav?.sameDayInOrganisingGroup,
      ...actionNav?.sameDayInCampaign,
    }).filter(Boolean).length > 0

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
    <div className="bg-gwBackground" style={{ minHeight: '66vh' }}>
      <AdminEditBanner page={action} />
      <div className="mx-auto py-4 md:py-5 px-4 grid grid-cols-2 lg:grid-cols-[1fr_3fr_1fr] gap-4">
        <aside className="order-1 lg:order-0 text-right lg:flex flex-col gap-3 items-start rtl">
          {hasPreviousActions && (
            <PreviousActions
              actionNav={actionNav}
              previousRelatedActions={previousRelatedActions}
            />
          )}
        </aside>
        <main className="col-span-2 lg:col-span-1 flex flex-col gap-4">
          <ActionCard data={action} links displayStandaloneInfo />
          {hasSameDayActions && <SameDayActions actions={actionNav} />}
          <ActionHistogramContext action={action} />
        </main>
        <aside className="text-left flex flex-col gap-3 order-3">
          {hasNextActions && (
            <FollowingActions actionNav={actionNav} nextRelatedActions={nextRelatedActions} />
          )}
        </aside>
      </div>
    </div>
  )
}

function FollowingActions({
  actionNav,
  nextRelatedActions,
}: {
  actionNav: ActionNav
  nextRelatedActions: Action['relatedActions']
}) {
  return (
    <>
      <div className="text-sm text-zinc-500 font-semibold">Following actions</div>
      {Object.values(actionNav?.nextInCampaign ?? {}).map(
        (action) =>
          action &&
          action.campaigns?.docs?.[0] && (
            <ActionBreadcrumbNavLink
              direction="next"
              action={action}
              key={action.id}
              label="campaigns"
            />
          ),
      )}
      {nextRelatedActions?.map((relation) => (
        <ActionBreadcrumbNavLink
          direction="next"
          action={relation.action as Action}
          key={relation.id}
          label={relation.connectionType}
          description={relation.description}
        />
      ))}
      {Object.values(actionNav?.nextInCountry ?? {}).map(
        (action) =>
          action &&
          action.countries?.[0] && (
            <ActionBreadcrumbNavLink
              direction="next"
              action={action}
              key={action.id}
              label="countries"
            />
          ),
      )}
      {Object.values(actionNav?.nextInCategory ?? {}).map(
        (action) =>
          action &&
          action.categories?.[0] && (
            <ActionBreadcrumbNavLink
              direction="next"
              action={action}
              key={action.id}
              label="categories"
            />
          ),
      )}
      {Object.values(actionNav?.nextInOrganisingGroup ?? {}).map(
        (action) =>
          action &&
          action.organisingGroups?.[0] && (
            <ActionBreadcrumbNavLink
              direction="next"
              action={action}
              key={action.id}
              label="organisingGroups"
            />
          ),
      )}
    </>
  )
}

function PreviousActions({
  actionNav,
  previousRelatedActions,
}: {
  actionNav: ActionNav
  previousRelatedActions: Action['relatedActions']
}) {
  return (
    <>
      <div className="text-sm text-zinc-500 font-semibold mb-2">Previous actions</div>
      {Object.values(actionNav?.previousInCampaign ?? {}).map(
        (action) =>
          action &&
          action.campaigns?.docs?.[0] && (
            <ActionBreadcrumbNavLink
              direction="previous"
              action={action}
              key={action.id}
              label="campaigns"
            />
          ),
      )}
      {previousRelatedActions?.map((relation) => (
        <ActionBreadcrumbNavLink
          label={relation.connectionType}
          direction="previous"
          action={relation.action as Action}
          key={relation.id}
          description={relation.description}
        />
      ))}
      {Object.values(actionNav?.previousInCountry ?? {}).map(
        (action) =>
          action &&
          action.countries?.[0] && (
            <ActionBreadcrumbNavLink
              direction="previous"
              action={action}
              key={action.id}
              label="countries"
            />
          ),
      )}
      {Object.values(actionNav?.previousInCategory ?? {}).map(
        (action) =>
          action &&
          action.categories?.[0] && (
            <ActionBreadcrumbNavLink
              direction="previous"
              action={action}
              key={action.id}
              label="categories"
            />
          ),
      )}
      {Object.values(actionNav?.previousInCompany ?? {}).map(
        (action) =>
          action &&
          action.companies?.[0] && (
            <ActionBreadcrumbNavLink
              direction="previous"
              action={action}
              key={action.id}
              label="companies"
            />
          ),
      )}
      {Object.values(actionNav?.previousInOrganisingGroup ?? {}).map(
        (action) =>
          action &&
          action.organisingGroups?.[0] && (
            <ActionBreadcrumbNavLink
              direction="previous"
              action={action}
              key={action.id}
              label="organisingGroups"
            />
          ),
      )}
    </>
  )
}
function SameDayActions({ actions }: { actions: ActionNav }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm text-zinc-500 font-semibold">Also on this day</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        {Object.values(actions?.sameDayInCampaign ?? {}).map(
          (action) =>
            action &&
            action.campaigns?.docs?.[0] && (
              <ActionBreadcrumbNavLink
                direction="sameDay"
                action={action}
                key={action.id}
                label="campaigns"
              />
            ),
        )}
        {Object.values(actions?.sameDayInCountry ?? {}).map(
          (action) =>
            action && (
              <ActionBreadcrumbNavLink
                direction="sameDay"
                action={action}
                key={action.id}
                label="countries"
              />
            ),
        )}
        {Object.values(actions?.sameDayInCategory ?? {}).map(
          (action) =>
            action && (
              <ActionBreadcrumbNavLink
                direction="sameDay"
                action={action}
                key={action.id}
                label="categories"
              />
            ),
        )}
        {Object.values(actions?.sameDayInCompany ?? {}).map(
          (action) =>
            action && (
              <ActionBreadcrumbNavLink
                direction="sameDay"
                action={action}
                key={action.id}
                label="organisingGroups"
              />
            ),
        )}
        {Object.values(actions?.sameDayInOrganisingGroup ?? {}).map(
          (action) =>
            action && (
              <ActionBreadcrumbNavLink
                direction="sameDay"
                action={action}
                key={action.id}
                label="organisingGroups"
              />
            ),
        )}
      </div>
    </div>
  )
}

function ActionBreadcrumbNavLink({
  action,
  label,
  direction,
  description,
}: {
  action: Action
  label:
    | CollectionSlug
    | NonNullable<Config['collections']['actions']['relatedActions']>[0]['connectionType']
  direction: 'previous' | 'next' | 'sameDay'
  description?: string
}) {
  return (
    <Link
      key={action.path!}
      href={action.path!}
      className={twMerge('flex items-center gap-2 hover:bg-snot-200 p-2 rounded-md justify-start')}
    >
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
      <div className="flex flex-col gap-0.5">
        <div
          className={twMerge(
            'text-xs flex flex-wrap gap-x-1 ltr items-center',
            direction === 'previous' ? 'text-right ml-auto justify-end' : 'text-left justify-start',
          )}
        >
          <span className="text-xs text-zinc-400">
            {label === 'categories'
              ? direction === 'previous'
                ? 'Previous'
                : direction === 'next'
                  ? 'Next'
                  : 'Also today: '
              : direction === 'previous'
                ? 'Previously in'
                : direction === 'next'
                  ? 'Next in'
                  : 'Also today in'}
          </span>
          {label === 'countries' ? (
            action.countries
              ?.slice(0, 3)
              .map((country) => (
                <CountryLabel
                  country={country as unknown as Country}
                  key={(country as Country).id}
                />
              ))
          ) : label === 'categories' ? (
            action.categories
              ?.slice(0, 3)
              .map((category) => (
                <CategoryLabel
                  category={category as unknown as Category}
                  key={(category as Category).id}
                />
              ))
          ) : label === 'companies' ? (
            action.companies
              ?.slice(0, 3)
              .map((company) => (
                <CompanyLabel
                  company={company as unknown as Company}
                  key={(company as Company).id}
                />
              ))
          ) : label === 'organisingGroups' ? (
            action.organisingGroups
              ?.slice(0, 3)
              .map((organisingGroup) => (
                <OrganisingGroupLabel
                  organisingGroup={organisingGroup as unknown as OrganisingGroup}
                  key={(organisingGroup as OrganisingGroup).id}
                />
              ))
          ) : label === 'campaigns' ? (
            action.campaigns?.docs
              ?.slice(0, 3)
              .map((campaign) => (
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
          {label === 'categories' && <span className="text-xs text-zinc-400">action</span>}
        </div>
        <div className="text-base font-medium leading-snug">{action.name}</div>
        {description && <div className="text-xs text-zinc-400 italic mt-0.5">{description}</div>}
        {action.date && (
          <span
            className={twMerge(
              'text-xs text-zinc-400 ltr',
              direction === 'previous' ? 'text-right ml-auto' : 'text-left',
            )}
          >
            <DateTime date={action.date} />
          </span>
        )}
      </div>
    </Link>
  )
}

export interface ActionNav {
  // Country
  previousInCountry?: {
    [isoA2: string]: Action | null | undefined
  }
  sameDayInCountry?: {
    [isoA2: string]: Action | null | undefined
  }
  nextInCountry?: {
    [isoA2: string]: Action | null | undefined
  }
  // Category
  previousInCategory?: {
    [category: string]: Action | null | undefined
  }
  sameDayInCategory?: {
    [category: string]: Action | null | undefined
  }
  nextInCategory?: {
    [category: string]: Action | null | undefined
  }
  // Company
  previousInCompany?: {
    [company: string]: Action | null | undefined
  }
  sameDayInCompany?: {
    [company: string]: Action | null | undefined
  }
  nextInCompany?: {
    [company: string]: Action | null | undefined
  }
  // Organising Group
  previousInOrganisingGroup?: {
    [organisingGroup: string]: Action | null | undefined
  }
  sameDayInOrganisingGroup?: {
    [organisingGroup: string]: Action | null | undefined
  }
  nextInOrganisingGroup?: {
    [organisingGroup: string]: Action | null | undefined
  }
  // Campaign
  previousInCampaign?: {
    [campaign: string]: Action | null | undefined
  }
  sameDayInCampaign?: {
    [campaign: string]: Action | null | undefined
  }
  nextInCampaign?: {
    [campaign: string]: Action | null | undefined
  }
}
