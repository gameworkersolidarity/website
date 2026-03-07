import { HomepageClient } from './Homepage.client'
import type { Action, Campaign, Category, Company, Country, OrganisingGroup } from '@/payload-types'
import { getCachedData } from '@/utils/payload.server'
import type { Payload } from 'payload'
import { validatePayloadResult } from '@/utils/validate-payload'
import { CACHE_KEYS } from '@/lib/cache'

// Segment config must be a literal; value = CACHE_REVALIDATE_SECONDS (12h)
export const revalidate = 43200

async function getHomepageData(query: Payload['find']): Promise<{
  actions: Action[]
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  campaigns: Campaign[]
}> {
  const [actionsResult, categoriesResult, companiesResult, organisingGroupsResult, campaignResult] =
    await Promise.all([
      query({
        collection: 'actions',
        sort: '-date',
        depth: 1,
        pagination: false,
        select: {
          airtableId: false,
          submissionContactDetails: false,
          consent: false,
          relatedActions: false,
        },
      }).then((r) => validatePayloadResult('actions', r, false)),
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
  return buildHomepagePayload(
    actionsResult,
    categoriesResult,
    companiesResult,
    organisingGroupsResult,
    campaignResult,
  )
}

function buildHomepagePayload(
  actionsResult: { docs: { countries?: unknown }[] },
  categoriesResult: { docs: unknown[] },
  companiesResult: { docs: unknown[] },
  organisingGroupsResult: { docs: unknown[] },
  campaignResult: { docs: unknown[] },
): {
  actions: Action[]
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  campaigns: Campaign[]
} {
  const countriesMap = new Map<string, Country>()
  actionsResult.docs.forEach((action) => {
    if (action.countries) {
      const countries = Array.isArray(action.countries) ? action.countries : [action.countries]
      countries.forEach((country) => {
        if (country && typeof country === 'object' && 'id' in country) {
          const countryId = String((country as { id: string }).id)
          if (!countriesMap.has(countryId)) {
            countriesMap.set(countryId, country as Country)
          }
        }
      })
    }
  })
  const uniqueCountries = Array.from(countriesMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  )
  return {
    actions: actionsResult.docs as Action[],
    countries: uniqueCountries,
    categories: categoriesResult.docs as Category[],
    companies: companiesResult.docs as Company[],
    organisingGroups: organisingGroupsResult.docs as OrganisingGroup[],
    campaigns: campaignResult.docs as Campaign[],
  }
}

export default async function HomePage() {
  const data = await getCachedData(CACHE_KEYS.HOMEPAGE, ({ query }) => getHomepageData(query))

  return (
    <HomepageClient
      actions={data.actions}
      countries={data.countries}
      categories={data.categories}
      companies={data.companies}
      organisingGroups={data.organisingGroups}
      campaigns={data.campaigns}
    />
  )
}
