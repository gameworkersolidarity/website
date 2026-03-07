import React from 'react'
import Link from 'next/link'
import { getCachedData } from '@/utils/payload.server'
import { DraftBadge } from '@/components/DraftBadge'
import { CACHE_KEYS } from '@/lib/cache'
import type { Payload } from 'payload'

export const metadata = {
  title: 'Countries',
  description:
    'Explore countries where solidarity actions have taken place in the global video game industry.',
}

// Segment config must be a literal; value = 12h (see CACHE_REVALIDATE_SECONDS in lib/cache)
export const revalidate = 43200

async function getCountriesIndexData(query: Payload['find']) {
  const [countriesResult, actionsResult] = await Promise.all([
    query({
      collection: 'countries',
      depth: 0,
      pagination: false,
      sort: 'Name',
    }),
    query({
      collection: 'actions',
      depth: 0,
      pagination: false,
      select: { countries: true },
    }),
  ])

  const countByCountryId = new Map<string, number>()
  for (const action of actionsResult.docs) {
    const countries = action.countries
      ? Array.isArray(action.countries)
        ? action.countries
        : [action.countries]
      : []
    for (const ref of countries) {
      const id =
        typeof ref === 'object' && ref !== null && 'id' in ref ? String(ref.id) : String(ref)
      countByCountryId.set(id, (countByCountryId.get(id) ?? 0) + 1)
    }
  }

  return countriesResult.docs
    .map((country) => ({
      country,
      actionCount: countByCountryId.get(String(country.id)) ?? 0,
    }))
    .filter((item) => item.actionCount > 0)
}

export default async function CountriesPage() {
  const filteredCountries = await getCachedData(CACHE_KEYS.COUNTRIES_INDEX, ({ query }) =>
    getCountriesIndexData(query),
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
        Countries
      </h1>
      <p
        className="text-muted-foreground text-center max-w-[800px] mx-auto mb-12"
        style={{
          fontSize: '1.125rem',
        }}
      >
        Explore countries where solidarity actions have taken place in the global video game
        industry.
      </p>

      {filteredCountries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No countries with solidarity actions found. Check back soon!</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredCountries.map(({ country, actionCount }) => (
            <Link
              key={country.id}
              href={`/countries/${country.slug}`}
              style={{
                display: 'block',
                padding: '1.5rem',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s',
              }}
            >
              <h2
                className="text-accent-blue"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                {country.name}
                {country._status === 'draft' && <DraftBadge />}
              </h2>
              {country.isoA2 && (
                <p className="text-sm text-muted-foreground m-0">{country.isoA2.toUpperCase()}</p>
              )}
              <p className="text-sm text-muted-foreground m-0">
                {actionCount} action{actionCount !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
