import React from 'react'
import Link from 'next/link'
import { payloadUserQuery } from '@/utils/payload.server'
import { DraftBadge } from '@/components/DraftBadge'

export const metadata = {
  title: 'Countries',
  description:
    'Explore countries where solidarity actions have taken place in the global video game industry.',
}

export default async function CountriesPage() {
  // Fetch all countries
  const countriesResult = await payloadUserQuery({
    collection: 'countries',
    depth: 0,
    pagination: false,
    sort: 'Name',
  })

  // Count actions for each country and filter out countries with no actions
  const countriesWithActions = await Promise.all(
    countriesResult.docs.map(async (country) => {
      const actionResults = await payloadUserQuery({
        collection: 'actions',
        where: {
          and: [
            {
              countries: {
                in: [country.id],
              },
            },
          ],
        },
        sort: '-date',
        limit: 1,
        depth: 0,
      })
      return {
        country,
        actionCount: actionResults.totalDocs,
      }
    }),
  )

  const filteredCountries = countriesWithActions.filter((item) => item.actionCount > 0)

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
        style={{
          fontSize: '1.125rem',
          color: '#666',
          marginBottom: '3rem',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto 3rem',
        }}
      >
        Explore countries where solidarity actions have taken place in the global video game
        industry.
      </p>

      {filteredCountries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
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
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#4A90E2',
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
                <p style={{ fontSize: '0.875rem', color: '#888', margin: 0 }}>
                  {country.isoA2.toUpperCase()}
                </p>
              )}
              <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                {actionCount} action{actionCount !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
