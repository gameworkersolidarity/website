import React from 'react'
import { getCachedData } from '@/utils/payload.server'
import { CompaniesGrid } from './CompaniesGrid.client'
import { CACHE_KEYS } from '@/lib/cache'
import type { Payload } from 'payload'

export const metadata = {
  title: 'Companies',
  description:
    'Explore companies in the global video game industry where solidarity actions have taken place.',
}

// Segment config must be a literal; value = 12h (see CACHE_REVALIDATE_SECONDS in lib/cache)
export const revalidate = 43200

async function getCompaniesIndexData(query: Payload['find']) {
  const [companiesResult, actionsResult] = await Promise.all([
    query({
      collection: 'companies',
      depth: 0,
      pagination: false,
      sort: 'Name',
    }),
    query({
      collection: 'actions',
      depth: 0,
      pagination: false,
      select: { companies: true },
    }),
  ])

  const countByCompanyId = new Map<string, number>()
  for (const action of actionsResult.docs) {
    const companies = action.companies
      ? Array.isArray(action.companies)
        ? action.companies
        : [action.companies]
      : []
    for (const ref of companies) {
      const id =
        typeof ref === 'object' && ref !== null && 'id' in ref ? String(ref.id) : String(ref)
      countByCompanyId.set(id, (countByCompanyId.get(id) ?? 0) + 1)
    }
  }

  return companiesResult.docs
    .map((company) => ({
      company,
      actionCount: countByCompanyId.get(String(company.id)) ?? 0,
    }))
    .filter((item) => item.actionCount > 0)
}

export default async function CompaniesPage() {
  const filteredCompanies = await getCachedData(CACHE_KEYS.COMPANIES_INDEX, ({ query }) =>
    getCompaniesIndexData(query),
  )

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        Companies
      </h1>
      <p
        style={{
          fontSize: '1.125rem',
          color: '#666',
          marginBottom: '3rem',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto 3rem',
        }}
      >
        Explore companies in the global video game industry where solidarity actions have taken
        place.
      </p>

      {filteredCompanies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          <p>No companies with solidarity actions found. Check back soon!</p>
        </div>
      ) : (
        <CompaniesGrid items={filteredCompanies} />
      )}
    </div>
  )
}
