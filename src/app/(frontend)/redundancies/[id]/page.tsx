import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const redundancy = await payload
    .findByID({
      collection: 'redundancies',
      id: parseInt(id),
      depth: 2,
    })
    .catch(() => null)

  if (!redundancy) {
    return {
      title: 'Redundancy Not Found',
    }
  }

  return {
    title: `${redundancy.studio} Redundancy - ${new Date(redundancy.date).getFullYear()} | Game Workers Solidarity Platform`,
    description: `Redundancy at ${redundancy.studio}${redundancy.headcount ? ` affecting ${redundancy.headcount} people` : ''}`,
  }
}

export default async function RedundancyPage({ params }: Props) {
  const { id } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const redundancy = await payload
    .findByID({
      collection: 'redundancies',
      id: parseInt(id),
      depth: 2,
    })
    .catch(() => null)

  if (!redundancy) {
    notFound()
  }

  const date = new Date(redundancy.date)
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const company =
    typeof redundancy.company === 'object' && redundancy.company !== null
      ? redundancy.company
      : null

  const parentCompany =
    typeof redundancy.parentCompany === 'object' && redundancy.parentCompany !== null
      ? redundancy.parentCompany
      : null

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link
        href="/redundancies"
        style={{
          display: 'inline-block',
          marginBottom: '1rem',
          color: '#4A90E2',
          textDecoration: 'none',
        }}
      >
        ← Back to Redundancies
      </Link>

      <div
        style={{
          background: '#f9f9f9',
          padding: '2rem',
          borderRadius: '8px',
          borderLeft: '4px solid #d32f2f',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <span
            style={{
              background: '#d32f2f',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Redundancy
          </span>
          <span style={{ fontSize: '1rem', color: '#666' }}>{formattedDate}</span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          {redundancy.studio}
        </h1>

        {redundancy.type && (
          <div style={{ marginBottom: '1rem' }}>
            <span
              style={{
                background: '#e0e0e0',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                fontSize: '0.9rem',
                color: '#666',
              }}
            >
              {redundancy.type}
            </span>
          </div>
        )}

        {redundancy.headcount && (
          <div
            style={{
              fontSize: '1.25rem',
              color: '#d32f2f',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            {redundancy.headcount.toLocaleString()} people affected
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {redundancy.studioLocation && (
            <div style={{ fontSize: '1rem', color: '#666' }}>
              <strong>Location:</strong> {redundancy.studioLocation}
            </div>
          )}

          {company && typeof company === 'object' && 'slug' in company && company.slug && (
            <div style={{ fontSize: '1rem', color: '#666' }}>
              <strong>Company:</strong>{' '}
              <Link
                href={`/companies/${company.slug}`}
                style={{ color: '#4A90E2', textDecoration: 'none' }}
              >
                {company.Name || redundancy.studio}
              </Link>
            </div>
          )}

          {redundancy.parent && (
            <div style={{ fontSize: '1rem', color: '#666' }}>
              <strong>Parent Company:</strong>{' '}
              {parentCompany &&
              typeof parentCompany === 'object' &&
              'slug' in parentCompany &&
              parentCompany.slug ? (
                <Link
                  href={`/companies/${parentCompany.slug}`}
                  style={{ color: '#4A90E2', textDecoration: 'none' }}
                >
                  {redundancy.parent}
                </Link>
              ) : (
                redundancy.parent
              )}
              {redundancy.parentLocation && ` (${redundancy.parentLocation})`}
            </div>
          )}
        </div>
      </div>

      {company && typeof company === 'object' && 'slug' in company && company.slug && (
        <div style={{ marginTop: '2rem' }}>
          <Link
            href={`/companies/${company.slug}`}
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#4A90E2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 500,
            }}
          >
            View Company Page →
          </Link>
        </div>
      )}
    </div>
  )
}

