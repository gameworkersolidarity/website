import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import Link from 'next/link'
import { ActionsTimeline } from '../../components/ActionsTimeline'
import { CollapsibleSection } from '../../components/CollapsibleSection'
import { Company } from '@/payload-types'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const groupsResult = await payload.find({
    collection: 'organisingGroups',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit: 100,
    depth: 0,
  })

  return groupsResult.docs.map((group) => ({
    slug: group.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const groupResult = await payload.find({
    collection: 'organisingGroups',
    where: {
      slug: {
        equals: slug,
      },
      ...(!isDraftMode
        ? {
            _status: {
              equals: 'published',
            },
          }
        : {}),
    },
    depth: 0,
    draft: isDraftMode,
    limit: 1,
  })

  if (groupResult.docs.length === 0) {
    return {
      title: 'Organising Group Not Found',
    }
  }

  const group = groupResult.docs[0]
  return {
    title: `${group.FullName || group.name} - Organising Groups - Game Workers Solidarity Platform`,
    description: `Learn about ${group.FullName || group.name} and related solidarity actions.`,
  }
}

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
      depth: 2, // Include related solidarity actions and their related entities
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

  // Query solidarity actions directly where this organising group is related
  const actionsResult = await payload.find({
    collection: 'events',
    where: {
      and: [
        {
          organisingGroups: {
            in: [group.id],
          },
        },
        ...(!isDraftMode
          ? [
              {
                _status: {
                  equals: 'published',
                },
              },
            ]
          : []),
      ],
    },
    depth: 2, // Include related entities
    draft: isDraftMode,
    pagination: false,
  })

  const events = actionsResult.docs

  // Extract unique companies from solidarity actions
  const companiesSet = new Map<string, Company>()

  events.forEach((action) => {
    // Extract companies
    if (action.companies && Array.isArray(action.companies)) {
      action.companies.forEach((company) => {
        if (
          typeof company === 'object' &&
          company !== null &&
          'id' in company &&
          'slug' in company &&
          'Name' in company
        ) {
          const companyId = String(company.id)
          if (!companiesSet.has(companyId)) {
            companiesSet.set(companyId, company)
          }
        }
      })
    }
  })

  const uniqueCompanies = Array.from(companiesSet.values())

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link
        href="/organising-groups"
        style={{
          display: 'inline-block',
          marginBottom: '1rem',
          color: '#4A90E2',
          textDecoration: 'none',
        }}
      >
        ← Back to Organising Groups
      </Link>

      <h1>{group.FullName || group.name}</h1>
      {group.name !== group.FullName && group.name && (
        <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>
          Also known as: {group.name}
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
      {uniqueCompanies.length > 0 && (
        <CollapsibleSection title={`Related Companies (${uniqueCompanies.length})`}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {uniqueCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.slug}`}
                style={{
                  color: '#4A90E2',
                  textDecoration: 'none',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
              >
                {company.name}
              </Link>
            ))}
          </div>
        </CollapsibleSection>
      )}
      {group.Country && Array.isArray(group.Country) && group.Country.length > 0 && (
        <CollapsibleSection title={`Countries (${group.Country.length})`}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {group.Country.map((country, index) => (
              <div key={index}>
                {typeof country === 'object' && country !== null && 'slug' in country ? (
                  <Link
                    href={`/countries/${country.slug}`}
                    style={{
                      color: '#4A90E2',
                      textDecoration: 'none',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      display: 'block',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    {typeof country === 'object' && 'Name' in country
                      ? country.name
                      : 'Unknown Country'}
                  </Link>
                ) : (
                  <span
                    style={{
                      padding: '0.5rem',
                      display: 'block',
                      color: '#666',
                    }}
                  >
                    {typeof country === 'object' &&
                    country !== null &&
                    'Name' in country &&
                    typeof (country as { Name?: unknown }).name === 'string'
                      ? (country as { Name: string }).name
                      : 'Unknown Country'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
      {events.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Related Solidarity Actions</h2>
          <ActionsTimeline
            events={events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
          />
        </div>
      )}
    </div>
  )
}
