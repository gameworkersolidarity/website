import { getPayload } from 'payload'
import config from '@/payload.config'
import { draftMode } from 'next/headers'
import { HomepageClient } from './Homepage.client'
import { Country } from '@/payload-types'

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = (await draftMode()).isEnabled

  // Fetch all actions with related data
  // Include both published and legacy records (where _status is null)
  // Fetch all filter options
  const [actionsResult, categoriesResult, companiesResult, organisingGroupsResult, campaignResult] =
    await Promise.all([
      await payload.find({
        collection: 'actions',
        where: {
          // Only fetch published content when not in draft mode
          ...(!isDraftMode
            ? {
                _status: {
                  equals: 'published',
                },
              }
            : {}),
        },
        sort: '-date',
        depth: 2, // Include related data (countries, categories, companies, organising groups)
        pagination: false,
      }),
      payload.find({
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
      payload.find({
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
      payload.find({
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
      payload.find({
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
