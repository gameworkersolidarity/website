import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import { LexicalRenderer } from '../../components/LexicalRenderer'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const post = await payload
    .find({
      collection: 'blogPosts',
      depth: 2, // Include image relation
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

  if (!post) {
    notFound()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>{post.Title}</h1>
      {post.ByLine && (
        <p style={{ fontSize: '1rem', color: '#666', fontStyle: 'italic' }}>{post.ByLine}</p>
      )}
      {post.Date && (
        <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>
          {new Date(post.Date).toLocaleDateString()}
        </p>
      )}
      {post.Image && typeof post.Image === 'object' && 'url' in post.Image && (
        <img
          src={post.Image.url as string}
          alt={post.Title}
          style={{ width: '100%', height: 'auto', marginBottom: '2rem' }}
        />
      )}
      {post.Summary && (
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '1.5rem' }}>{post.Summary}</p>
      )}
      <div style={{ marginTop: '2rem' }}>
        <LexicalRenderer content={post.Body} />
      </div>
    </div>
  )
}
