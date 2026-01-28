import { getPayload } from 'payload'
import config from '@/payload.config'
import { HomepageClient } from './Homepage.client'
import { Country } from '@/payload-types'
import { fetchDraftMode } from '@/utils/auth'
import { payloadUserQuery } from '@/utils/payload.server'
import { validatePayloadResult } from '@/utils/validate-payload'

export default async function HomePage() {
  // Fetch all actions with related data
  // Include both published and legacy records (where _status is null)
  // Fetch all filter options
  const [actionsResult, categoriesResult, companiesResult, organisingGroupsResult, campaignResult] =
    await Promise.all([
      payloadUserQuery({
        collection: 'actions',
        sort: '-date',
        depth: 2, // Include related data (countries, categories, companies, organising groups)
        pagination: false,
      }).then((result) => validatePayloadResult('actions', result)),
      payloadUserQuery({
        collection: 'categories',
        pagination: false,
        select: {
          name: true,
          id: true,
          slug: true,
          emoji: true,
          path: true,
        },
        sort: ['name'],
      }).then((result) => validatePayloadResult('categories', result, false)),
      payloadUserQuery({
        collection: 'companies',
        pagination: false,
        select: {
          name: true,
          id: true,
          slug: true,
          path: true,
        },
        sort: ['name'],
      }).then((result) => validatePayloadResult('companies', result, false)),
      payloadUserQuery({
        collection: 'organisingGroups',
        pagination: false,
        select: {
          name: true,
          id: true,
          slug: true,
          path: true,
        },
        sort: ['name'],
      }).then((result) => validatePayloadResult('organisingGroups', result, false)),
      payloadUserQuery({
        collection: 'campaigns',
        pagination: false,
        select: {
          name: true,
          id: true,
          slug: true,
          emoji: true,
          path: true,
        },
        sort: ['name'],
      }).then((result) => validatePayloadResult('campaigns', result, false)),
    ])

  // Dedupe countries by id to ensure genuinely unique list
  const countriesMap = new Map<string, Country>()
  actionsResult.docs.forEach((action) => {
    if (action.countries) {
      const countries = Array.isArray(action.countries) ? action.countries : [action.countries]
      countries.forEach((country) => {
        if (country && typeof country === 'object' && 'id' in country) {
          const countryId = String(country.id)
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

  return (
    <HomepageClient
      actions={actionsResult.docs}
      countries={uniqueCountries}
      categories={categoriesResult.docs}
      companies={companiesResult.docs}
      organisingGroups={organisingGroupsResult.docs}
      campaigns={campaignResult.docs}
    />
  )
}
