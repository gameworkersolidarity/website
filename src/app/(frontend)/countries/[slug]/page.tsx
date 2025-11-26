import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import Link from 'next/link'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import { ActionsTimeline } from '../../components/ActionsTimeline'
import { CollapsibleSection } from '../../components/CollapsibleSection'
import { Company } from '@/payload-types'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const countriesResult = await payload.find({
    collection: 'countries',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit: 100,
    depth: 1,
  })

  return countriesResult.docs.map((country) => ({
    slug: country.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const countryResult = await payload.find({
    collection: 'countries',
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

  if (countryResult.docs.length === 0) {
    return {
      title: 'Country Not Found',
    }
  }

  const country = countryResult.docs[0]
  return {
    title: `${country.name} - Countries - Game Workers Solidarity Platform`,
    description: `Explore solidarity actions and organising groups in ${country.name}.`,
  }
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function CountryPage({ params }: Props) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const country = await payload
    .find({
      collection: 'countries',
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

  if (!country) {
    notFound()
  }

  // Query solidarity actions directly where this country is related
  const actionsResult = await payload.find({
    collection: 'events',
    where: {
      and: [
        {
          countries: {
            in: [country.id],
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

  const organisingGroups = await payload.find({
    collection: 'organisingGroups',
    where: {
      countries: {
        in: [country.id],
      },
    },
  })

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link
        href="/countries"
        style={{
          display: 'inline-block',
          marginBottom: '1rem',
          color: '#4A90E2',
          textDecoration: 'none',
        }}
      >
        ← Back to Countries
      </Link>

      <h1>{country.name}</h1>
      {country.countryCode && (
        <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>
          Country Code: {country.countryCode.toUpperCase()}
        </p>
      )}
      {country.description && (
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <LexicalRenderer content={country.description} />
        </div>
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
      {organisingGroups && Array.isArray(organisingGroups) && organisingGroups.length > 0 && (
        <CollapsibleSection title={`Unions & Organising Groups (${organisingGroups.length})`}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {organisingGroups.map((organisingGroup, index) => (
              <div key={index}>
                <Link
                  href={`/organising-groups/${(organisingGroup as { slug: string }).slug}`}
                  style={{
                    color: '#4A90E2',
                    textDecoration: 'none',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    display: 'block',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {organisingGroup.fullName || organisingGroup.name}
                </Link>
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
