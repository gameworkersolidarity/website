import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import { LexicalRenderer } from '../../components/LexicalRenderer'

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

  if (!company) {
    notFound()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>{company.Name}</h1>
      {company.Summary && (
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <LexicalRenderer content={company.Summary} />
        </div>
      )}
      {company.SolidarityActions &&
        Array.isArray(company.SolidarityActions) &&
        company.SolidarityActions.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Related Solidarity Actions</h2>
            <ul>
              {company.SolidarityActions.map((action, index) => (
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
