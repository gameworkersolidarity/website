import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import { LexicalRenderer } from '../../components/LexicalRenderer'

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
              Public: {
                equals: true,
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
              <li key={index}>
                {typeof company === 'object' && 'Name' in company
                  ? company.Name
                  : 'Unknown Company'}
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
                <li key={index}>
                  {typeof group === 'object' && 'Name' in group ? group.Name : 'Unknown Group'}
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
              <li key={index}>
                {typeof country === 'object' &&
                country !== null &&
                'name' in country &&
                typeof country.name === 'string'
                  ? country.name
                  : 'Unknown Country'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
