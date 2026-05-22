import { HomepageClient } from './Homepage.client'
import type { Action, Campaign, Category, Company, Country, OrganisingGroup } from '@/payload-types'
import { getCachedData } from '@/utils/payload.server'
import type { Payload } from 'payload'
import { validatePayloadResult } from '@/utils/validate-payload'
import { CACHE_KEYS } from '@/lib/cache'

// Segment config must be a literal; value = CACHE_REVALIDATE_SECONDS (12h)
export const revalidate = 43200

async function getActions(query: Payload['find']) {
  const actions = await query({
    collection: 'actions',
    sort: '-date',
    depth: 1,
    pagination: false,
    select: {
      airtableId: false,
      submissionContactDetails: false,
      consent: false,
      relatedActions: false,
      coordinates: false,
      generateSlug: false,
    },
  }).then((r) => validatePayloadResult('actions', r, false))
  return actions.docs
}

async function getFilterData(query: Payload['find']): Promise<{
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  campaigns: Campaign[]
}> {
  const [
    countriesResult,
    categoriesResult,
    companiesResult,
    organisingGroupsResult,
    campaignResult,
  ] = await Promise.all([
    query({
      collection: 'countries',
      pagination: false,
      select: { name: true, id: true, slug: true, emoji: true, path: true },
      sort: ['name'],
    }).then((r) => validatePayloadResult('countries', r, false)),
    query({
      collection: 'categories',
      pagination: false,
      select: { name: true, id: true, slug: true, emoji: true, path: true },
      sort: ['name'],
    }).then((r) => validatePayloadResult('categories', r, false)),
    query({
      collection: 'companies',
      pagination: false,
      select: { name: true, id: true, slug: true, path: true },
      sort: ['name'],
    }).then((r) => validatePayloadResult('companies', r, false)),
    query({
      collection: 'organisingGroups',
      pagination: false,
      select: { name: true, id: true, slug: true, path: true },
      sort: ['name'],
    }).then((r) => validatePayloadResult('organisingGroups', r, false)),
    query({
      collection: 'campaigns',
      pagination: false,
      select: { name: true, id: true, slug: true, emoji: true, path: true },
      sort: ['name'],
    }).then((r) => validatePayloadResult('campaigns', r, false)),
  ])
  // Ensure each array has only unique items by id.
  countriesResult.docs = Array.from(
    new Map(countriesResult.docs.map((item) => [item.id, item])).values(),
  )
  categoriesResult.docs = Array.from(
    new Map(categoriesResult.docs.map((item) => [item.id, item])).values(),
  )
  companiesResult.docs = Array.from(
    new Map(companiesResult.docs.map((item) => [item.id, item])).values(),
  )
  organisingGroupsResult.docs = Array.from(
    new Map(organisingGroupsResult.docs.map((item) => [item.id, item])).values(),
  )
  campaignResult.docs = Array.from(
    new Map(campaignResult.docs.map((item) => [item.id, item])).values(),
  )
  return {
    countries: countriesResult.docs as Country[],
    categories: categoriesResult.docs as Category[],
    companies: companiesResult.docs as Company[],
    organisingGroups: organisingGroupsResult.docs as OrganisingGroup[],
    campaigns: campaignResult.docs as Campaign[],
  }
}

export default async function HomePage() {
  const actions = await getCachedData(CACHE_KEYS.ACTIONS_INDEX, ({ query }) => getActions(query), {
    ignoreCache: true,
  })
  const data = await getCachedData(CACHE_KEYS.HOMEPAGE, ({ query }) => getFilterData(query))

  return (
    <HomepageClient
      actions={actions}
      countries={data.countries}
      categories={data.categories}
      companies={data.companies}
      organisingGroups={data.organisingGroups}
      campaigns={data.campaigns}
    />
  )
}
