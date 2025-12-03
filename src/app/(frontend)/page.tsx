import { getPayload } from 'payload'
import config from '@/payload.config'
import { draftMode } from 'next/headers'
import { HomepageClient } from './Homepage.client'

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = (await draftMode()).isEnabled

  // Fetch all events with related data
  // Include both published and legacy records (where _status is null)
  const eventsResult = await payload.find({
    collection: 'events',
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
    depth: 1, // Include related data (countries, categories, companies, organising groups)
    pagination: false,
  })

  // Fetch all filter options
  const [
    countriesResult,
    categoriesResult,
    companiesResult,
    organisingGroupsResult,
    campaignResult,
  ] = await Promise.all([
    payload.find({
      collection: 'countries',
      pagination: false,
      select: {
        name: true,
        id: true,
        isoA2: true,
        emoji: true,
      },
      sort: ['name'],
    }),
    payload.find({
      collection: 'categories',
      pagination: false,
      select: {
        name: true,
        id: true,
        slug: true,
        emoji: true,
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
      },
      sort: ['name'],
    }),
  ])

  return (
    <HomepageClient
      events={eventsResult.docs}
      countries={countriesResult.docs}
      categories={categoriesResult.docs}
      companies={companiesResult.docs}
      organisingGroups={organisingGroupsResult.docs}
      campaigns={campaignResult.docs}
    />
  )
}
