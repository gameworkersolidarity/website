import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function OrganisingGroupPage({ params }: Props) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const group = await payload
    .find({
      collection: 'organisingGroups',
      depth: 1, // Include related solidarity actions
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

  if (!group) {
    notFound()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>{group.FullName || group.Name}</h1>
      {group.Name !== group.FullName && group.Name && (
        <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>
          Also known as: {group.Name}
        </p>
      )}
      {group.IsUnion && (
        <p
          style={{ fontSize: '0.9rem', color: '#4A90E2', marginBottom: '1rem', fontWeight: 'bold' }}
        >
          Union
        </p>
      )}
      {group.Website && (
        <p style={{ marginBottom: '0.5rem' }}>
          <a
            href={group.Website}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4A90E2' }}
          >
            Website
          </a>
        </p>
      )}
      {group.Twitter && (
        <p style={{ marginBottom: '0.5rem' }}>
          <a
            href={group.Twitter}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4A90E2' }}
          >
            Twitter
          </a>
        </p>
      )}
      {group.Bluesky && (
        <p style={{ marginBottom: '1rem' }}>
          <a
            href={group.Bluesky}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4A90E2' }}
          >
            Bluesky
          </a>
        </p>
      )}
      {group.Country && Array.isArray(group.Country) && group.Country.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Countries:</h3>
          <ul>
            {group.Country.map((country, index) => (
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
      {group.SolidarityActions &&
        Array.isArray(group.SolidarityActions) &&
        group.SolidarityActions.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Related Solidarity Actions</h2>
            <ul>
              {group.SolidarityActions.map((action, index) => (
                <li key={index} style={{ marginBottom: '0.5rem' }}>
                  <a
                    href={`/actions/${typeof action === 'object' && 'slug' in action ? action.slug : ''}`}
                    style={{ color: '#4A90E2', textDecoration: 'none' }}
                  >
                    {typeof action === 'object' && 'Name' in action
                      ? action.Name
                      : 'Unknown Action'}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  )
}
