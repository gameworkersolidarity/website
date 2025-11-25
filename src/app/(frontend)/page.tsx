import { getPayload } from 'payload'
import React from 'react'

import { ActionsFilters } from './components/ActionsFilters'
import { FilteredHomepageContent } from './components/FilteredHomepageContent'
import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch all events with related data
  // Include both published and legacy records (where _status is null)
  const eventsResult = await payload.find({
    collection: 'events',
    where: {
      or: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          _status: {
            equals: null,
          },
        },
      ],
    },
    depth: 2, // Include related data (countries, categories, companies, organising groups)
    pagination: false,
  })

  // Fetch all filter options
  const [countriesResult, categoriesResult, companiesResult, organisingGroupsResult] =
    await Promise.all([
      payload.find({
        collection: 'countries',
        pagination: false,
      }),
      payload.find({
        collection: 'categories',
        pagination: false,
      }),
      payload.find({
        collection: 'companies',
        pagination: false,
      }),
      payload.find({
        collection: 'organisingGroups',
        pagination: false,
      }),
    ])

  return (
    <div className="homepage">
      <div className="homepage-hero">
        <h1>{eventsResult.docs.length} events</h1>
      </div>

      <ActionsFilters
        countries={countriesResult.docs}
        categories={categoriesResult.docs}
        companies={companiesResult.docs}
        organisingGroups={organisingGroupsResult.docs}
      />

      <FilteredHomepageContent events={eventsResult.docs} countries={countriesResult.docs} />
    </div>
  )
}
