import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import Link from 'next/link'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function SolidarityActionPage({ params }: Props) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const action = await payload
    .find({
      collection: 'solidarityActions',
      depth: 2, // Include related data (countries, companies, etc.)
      draft: isDraftMode,
      limit: 1,
      where: {
        slug: {
          equals: slug,
        },
        // Only fetch published content when not in draft mode
        ...(!isDraftMode
          ? {
              _status: {
                equals: 'published',
              },
            }
          : {}),
      },
    })
    .then(({ docs }) => docs?.[0])

  if (!action) {
    notFound()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>{action.Name}</h1>
      {action.Location && (
        <p style={{ fontSize: '1rem', color: '#666', marginBottom: '0.5rem' }}>
          Location: {action.Location}
        </p>
      )}
      {action.Date && (
        <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>
          Date: {new Date(action.Date).toLocaleDateString()}
        </p>
      )}
      {action.Summary && (
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <LexicalRenderer content={action.Summary} />
        </div>
      )}
      {action.Link && (
        <p style={{ marginTop: '1rem' }}>
          <a
            href={action.Link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4A90E2' }}
          >
            Learn more
          </a>
        </p>
      )}
      {action.Company && Array.isArray(action.Company) && action.Company.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Companies:</h3>
          <ul>
            {action.Company.map((company, index) => (
              <li key={index} style={{ marginBottom: '0.5rem' }}>
                {typeof company === 'object' && company !== null && 'slug' in company ? (
                  <Link
                    href={`/companies/${company.slug}`}
                    style={{ color: '#4A90E2', textDecoration: 'none' }}
                  >
                    {typeof company === 'object' && 'Name' in company
                      ? company.Name
                      : 'Unknown Company'}
                  </Link>
                ) : (
                  <span>
                    {typeof company === 'object' && 'Name' in company
                      ? company.Name
                      : 'Unknown Company'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {action.OrganisingGroups &&
        Array.isArray(action.OrganisingGroups) &&
        action.OrganisingGroups.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Organising Groups:</h3>
            <ul>
              {action.OrganisingGroups.map((group, index) => (
                <li key={index} style={{ marginBottom: '0.5rem' }}>
                  {typeof group === 'object' && group !== null && 'slug' in group ? (
                    <Link
                      href={`/organising-groups/${group.slug}`}
                      style={{ color: '#4A90E2', textDecoration: 'none' }}
                    >
                      {typeof group === 'object' && 'FullName' in group
                        ? group.FullName || group.Name
                        : typeof group === 'object' && 'Name' in group
                          ? group.Name
                          : 'Unknown Group'}
                    </Link>
                  ) : (
                    <span>
                      {typeof group === 'object' && 'FullName' in group
                        ? group.FullName || group.Name
                        : typeof group === 'object' && 'Name' in group
                          ? group.Name
                          : 'Unknown Group'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      {action.Country && Array.isArray(action.Country) && action.Country.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Countries:</h3>
          <ul>
            {action.Country.map((country, index) => (
              <li key={index} style={{ marginBottom: '0.5rem' }}>
                {typeof country === 'object' && country !== null && 'slug' in country ? (
                  <Link
                    href={`/countries/${country.slug}`}
                    style={{ color: '#4A90E2', textDecoration: 'none' }}
                  >
                    {typeof country === 'object' && 'Name' in country
                      ? country.Name
                      : 'Unknown Country'}
                  </Link>
                ) : (
                  <span>
                    {typeof country === 'object' && country !== null && 'Name' in country
                      ? country.Name
                      : 'Unknown Country'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
