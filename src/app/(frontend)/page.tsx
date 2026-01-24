import { getPayload } from 'payload'
import config from '@/payload.config'
import { HomepageClient } from './Homepage.client'
import { Country } from '@/payload-types'
import { fetchDraftMode } from '@/utils/auth'
import { payloadUserQuery } from '@/utils/payload.server'

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
      }),
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
      }),
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
      }),
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
      }),
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
      }),
    ])

  const uniqueCountries = Array.from(
    new Set(actionsResult.docs.flatMap((action) => action.countries as Country[])),
  )
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))

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
