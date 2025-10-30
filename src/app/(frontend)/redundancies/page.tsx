import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import config from '@/payload.config'
import './redundancies.css'

export const metadata = {
  title: 'Redundancies & Layoffs | Game Workers Solidarity Platform',
  description:
    'Track redundancies and layoffs in the games industry, linked to companies.',
}

export default async function RedundanciesPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch all redundancies
  const redundanciesResult = await payload.find({
    collection: 'redundancies',
    depth: 2, // Include company data
    pagination: false,
    sort: '-date',
  })

  // Group by company for display
  const redundanciesByCompany = new Map()

  redundanciesResult.docs.forEach((redundancy: any) => {
    const companyId = redundancy.company?.id || 'unknown'
    const companyName =
      typeof redundancy.company === 'object' && redundancy.company?.Name
        ? redundancy.company.Name
        : redundancy.studio || 'Unknown Company'

    if (!redundanciesByCompany.has(companyId)) {
      redundanciesByCompany.set(companyId, {
        company: redundancy.company,
        companyName,
        redundancies: [],
      })
    }

    redundanciesByCompany.get(companyId).redundancies.push(redundancy)
  })

  // Calculate totals
  const totalRedundancies = redundanciesResult.docs.length
  const totalAffected = redundanciesResult.docs.reduce((sum: number, r: any) => {
    return sum + (r.headcount || 0)
  }, 0)
  const uniqueCompanies = redundanciesByCompany.size

  return (
    <div className="redundancies-page">
      <div className="redundancies-container">
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
          Redundancies & Layoffs
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '3rem', color: '#666', fontSize: '1.1rem' }}>
          Tracking redundancies and layoffs in the games industry, linked to companies.
        </p>

        {/* Summary Statistics */}
        <div className="redundancies-stats" style={{ marginBottom: '3rem' }}>
          <div className="stat-card">
            <div className="stat-value">{totalRedundancies.toLocaleString()}</div>
            <div className="stat-label">Total Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {totalAffected > 0 ? totalAffected.toLocaleString() : 'Unknown'}
            </div>
            <div className="stat-label">People Affected</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{uniqueCompanies.toLocaleString()}</div>
            <div className="stat-label">Companies</div>
          </div>
        </div>

        {redundanciesResult.docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            <p>No redundancies recorded yet.</p>
          </div>
        ) : (
          <div className="redundancies-list">
            {Array.from(redundanciesByCompany.entries()).map(([companyId, data]: [string, any]) => {
              const company = data.company
              const companyName = data.companyName

              return (
                <div key={companyId} className="company-redundancies">
                  <div className="company-header">
                    {company && typeof company === 'object' && company.id ? (
                      <Link 
                        href={company.slug ? `/companies/${company.slug}` : `/#company-${company.id}`} 
                        className="company-link"
                      >
                        <h2>{companyName}</h2>
                      </Link>
                    ) : (
                      <h2>{companyName}</h2>
                    )}
                    <span className="redundancy-count">
                      {data.redundancies.length} event{data.redundancies.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="redundancies-timeline">
                    {data.redundancies.map((redundancy: any) => {
                      const date = new Date(redundancy.date)
                      const formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })

                      return (
                        <div key={redundancy.id} className="redundancy-item">
                          <div className="redundancy-date">{formattedDate}</div>
                          <div className="redundancy-details">
                            <div className="redundancy-studio">
                              <strong>{redundancy.studio}</strong>
                              {redundancy.type && (
                                <span className="redundancy-type">{redundancy.type}</span>
                              )}
                            </div>
                            {redundancy.headcount && (
                              <div className="redundancy-headcount">
                                {redundancy.headcount.toLocaleString()} people affected
                              </div>
                            )}
                            {redundancy.studioLocation && (
                              <div className="redundancy-location">
                                Location: {redundancy.studioLocation}
                              </div>
                            )}
                            {redundancy.parent && (
                              <div className="redundancy-parent">
                                Parent:{' '}
                                {redundancy.parentCompany && typeof redundancy.parentCompany === 'object' && redundancy.parentCompany.slug ? (
                                  <Link
                                    href={`/companies/${redundancy.parentCompany.slug}`}
                                    className="parent-link"
                                  >
                                    {redundancy.parent}
                                  </Link>
                                ) : (
                                  redundancy.parent
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

