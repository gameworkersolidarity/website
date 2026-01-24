import { notFound } from 'next/navigation'
import React from 'react'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { generateMetadataForSlug } from '@/utils/generateMetadata'
import { payloadUserQuery } from '@/utils/payload.server'

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

  const page = await payloadUserQuery({
    collection: 'staticPages',
    depth: 0,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  }).then(({ docs }) => docs?.[0])

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
