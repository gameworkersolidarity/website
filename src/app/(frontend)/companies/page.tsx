import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import config from '@/payload.config'

export const metadata = {
  title: 'Companies - Game Workers Solidarity Platform',
  description:
    'Explore companies in the global video game industry where solidarity actions have taken place.',
}

export default async function CompaniesPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch all published companies
  const companiesResult = await payload.find({
    collection: 'companies',
    where: {
      _status: {
        equals: 'published',
      },
    },
    depth: 0,
    pagination: false,
    sort: 'Name',
  })

  // Count actions and redundancies for each company
  const companiesWithData = await Promise.all(
    companiesResult.docs.map(async (company) => {
      const [actionsResult, redundanciesResult] = await Promise.all([
        payload.find({
          collection: 'solidarityActions',
          where: {
            and: [
              {
                Company: {
                  in: [company.id],
                },
              },
              {
                _status: {
                  equals: 'published',
                },
              },
            ],
          },
          limit: 1,
          depth: 0,
        }),
        payload.find({
          collection: 'redundancies',
          where: {
            company: {
              equals: company.id,
            },
          },
          limit: 1,
          depth: 0,
        }),
      ])
      return {
        company,
        actionCount: actionsResult.totalDocs,
        redundancyCount: redundanciesResult.totalDocs,
      }
    }),
  )

  // Filter to show companies with either actions or redundancies
  const filteredCompanies = companiesWithData.filter(
    (item) => item.actionCount > 0 || item.redundancyCount > 0,
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
          <p>No companies with solidarity actions or redundancies found. Check back soon!</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredCompanies.map(({ company, actionCount, redundancyCount }) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
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
                  marginBottom: '0.75rem',
                  color: '#4A90E2',
                }}
              >
                {company.Name}
              </h2>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {actionCount > 0 && (
                  <p style={{ margin: '0 0 0.25rem 0' }}>
                    {actionCount} action{actionCount !== 1 ? 's' : ''}
                  </p>
                )}
                {redundancyCount > 0 && (
                  <p style={{ margin: 0 }}>
                    {redundancyCount} redundanc{redundancyCount !== 1 ? 'ies' : 'y'}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
