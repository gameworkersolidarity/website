import { fetchDraftMode } from '@/utils/auth'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { generateMetadataForSlug } from '@/utils/generateMetadata'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateMetadataForSlug({
    collection: 'staticPages',
    slug,
    notFoundTitle: 'Page Not Found',
  })
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = await fetchDraftMode(payload)

  const page = await payload
    .find({
      collection: 'staticPages',
      depth: 0,
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

  if (!page) {
    notFound()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>{page.title}</h1>
      {page.summary && <p style={{ fontSize: '1.2rem', color: '#666' }}>{page.summary}</p>}
      <LexicalRenderer content={page.body} />
    </div>
  )
}
