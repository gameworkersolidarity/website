import React from 'react'
import { payloadUserQuery } from '@/utils/payload.server'
import { CompaniesGrid } from './CompaniesGrid.client'

export const metadata = {
  title: 'Companies',
  description:
    'Explore companies in the global video game industry where solidarity actions have taken place.',
}

export default async function CompaniesPage() {
  // Fetch all published companies
  const companiesResult = await payloadUserQuery({
    collection: 'companies',
    depth: 0,
    pagination: false,
    sort: 'Name',
  })

  // Count actions for each company
  const companiesWithData = await Promise.all(
    companiesResult.docs.map(async (company) => {
      const actionsResult = await payloadUserQuery({
        collection: 'actions',
        where: {
          companies: {
            in: [company.id],
          },
        },
        sort: '-date',
      })
      return {
        company,
        actionCount: actionsResult.totalDocs,
      }
    }),
  )

  // Filter to show companies with actions
  const filteredCompanies = companiesWithData.filter((item) => item.actionCount > 0)

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
