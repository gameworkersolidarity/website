import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import Link from 'next/link'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import { UnifiedTimeline } from '../../components/UnifiedTimeline'
import { CollapsibleSection } from '../../components/CollapsibleSection'
import { Country, OrganisingGroup } from '@/payload-types'
import { ActionsTimeline } from '../../components/ActionsTimeline'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const companiesResult = await payload.find({
    collection: 'companies',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit: 100,
    depth: 0,
  })

  return companiesResult.docs.map((company) => ({
    slug: company.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const companyResult = await payload.find({
    collection: 'companies',
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

  if (companyResult.docs.length === 0) {
    return {
      title: 'Company Not Found',
    }
  }

  const company = companyResult.docs[0]
  return {
    title: `${company.Name} - Companies - Game Workers Solidarity Platform`,
    description: `Learn about ${company.Name} and related solidarity actions.`,
  }
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const company = await payload
    .find({
      collection: 'companies',
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

  if (!company) {
    notFound()
  }

  // Query solidarity actions and redundancies directly where this company is related
  const [actionsResult] = await Promise.all([
    payload.find({
      collection: 'events',
      where: {
        and: [
          {
            companies: {
              in: [company.id],
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
    }),
  ])

  const solidarityActions = actionsResult.docs

  // Extract unique countries and organising groups from solidarity actions
  const countriesSet = new Map<string, Country>()
  const organisingGroupsSet = new Map<string, OrganisingGroup>()

  solidarityActions.forEach((action) => {
    // Extract countries
    if (action.countries && Array.isArray(action.countries)) {
      action.countries.forEach((country) => {
        if (
          typeof country === 'object' &&
          country !== null &&
          'id' in country &&
          'slug' in country &&
          'Name' in country
        ) {
          const countryId = String(country.id)
          if (!countriesSet.has(countryId)) {
            countriesSet.set(countryId, country)
          }
        }
      })
    }
    // Extract organising groups
    if (action.organisingGroups && Array.isArray(action.organisingGroups)) {
      action.organisingGroups.forEach((group) => {
        if (
          typeof group === 'object' &&
          group !== null &&
          'id' in group &&
          'slug' in group &&
          'Name' in group
        ) {
          const groupId = String(group.id)
          if (!organisingGroupsSet.has(groupId)) {
            organisingGroupsSet.set(groupId, group)
          }
        }
      })
    }
  })

  const uniqueCountries = Array.from(countriesSet.values())
  const uniqueOrganisingGroups = Array.from(organisingGroupsSet.values())

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link
        href="/companies"
        style={{
          display: 'inline-block',
          marginBottom: '1rem',
          color: '#4A90E2',
          textDecoration: 'none',
        }}
      >
        ← Back to Companies
      </Link>

      <h1>{company.Name}</h1>
      {company.Summary && (
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <LexicalRenderer content={company.Summary} />
        </div>
      )}
      {uniqueCountries.length > 0 && (
        <CollapsibleSection title={`Related Countries (${uniqueCountries.length})`}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {uniqueCountries.map((country) => (
              <Link
                key={country.id}
                href={`/countries/${country.slug}`}
                style={{
                  color: '#4A90E2',
                  textDecoration: 'none',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
              >
                {country.Name}
              </Link>
            ))}
          </div>
        </CollapsibleSection>
      )}
      {uniqueOrganisingGroups.length > 0 && (
        <CollapsibleSection title={`Related Organising Groups (${uniqueOrganisingGroups.length})`}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {uniqueOrganisingGroups.map((group) => (
              <Link
                key={group.id}
                href={`/organising-groups/${group.slug}`}
                style={{
                  color: '#4A90E2',
                  textDecoration: 'none',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
              >
                {group.FullName || group.Name}
              </Link>
            ))}
          </div>
        </CollapsibleSection>
      )}
      {solidarityActions.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Timeline</h2>
          <ActionsTimeline
            events={solidarityActions.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )}
          />
        </div>
      )}
    </div>
  )
}
