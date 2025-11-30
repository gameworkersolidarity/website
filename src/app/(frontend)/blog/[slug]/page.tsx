import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import Link from 'next/link'
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

  // Fetch all published blog posts to find previous/next
  const allPosts = await payload.find({
    collection: 'blogPosts',
    where: {
      _status: {
        equals: 'published',
      },
    },
    sort: 'createdAt', // Sort by createdAt, newest first
    pagination: false,
  })

  // Find current post index and get previous/next
  const currentIndex = allPosts.docs.findIndex((p) => p.id === post.id)
  const previousPost = currentIndex > 0 ? allPosts.docs[currentIndex - 1] : null
  const nextPost =
    currentIndex >= 0 && currentIndex < allPosts.docs.length - 1
      ? allPosts.docs[currentIndex + 1]
      : null

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link
        href="/blog"
        style={{
          display: 'inline-block',
          marginBottom: '1.5rem',
          color: '#4A90E2',
          textDecoration: 'none',
        }}
      >
        ← Back to Blog
      </Link>

      <h1>{post.title}</h1>
      {post.byline && (
        <p style={{ fontSize: '1rem', color: '#666', fontStyle: 'italic' }}>{post.byline}</p>
      )}
      {post.createdAt && (
        <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>
          {new Date(post.createdAt).toLocaleDateString()}
        </p>
      )}
      {post.image && typeof post.image === 'object' && 'url' in post.image && (
        <img
          src={post.image.url as string}
          alt={post.title}
          style={{ width: '100%', height: 'auto', marginBottom: '2rem' }}
        />
      )}
      <div style={{ marginTop: '2rem' }}>
        <LexicalRenderer content={post.body} />
      </div>

      {/* Previous/Next Navigation */}
      {(previousPost || nextPost) && (
        <nav
          style={{
            marginTop: '4rem',
            paddingTop: '2rem',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '2rem',
          }}
        >
          {previousPost ? (
            <Link
              href={`/blog/${previousPost.slug}`}
              style={{
                flex: 1,
                padding: '1rem',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background-color 0.2s',
              }}
            >
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                ← Previous Post
              </div>
              <div style={{ fontWeight: 600, color: '#333' }}>{previousPost.title as string}</div>
            </Link>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              style={{
                flex: 1,
                padding: '1rem',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                textAlign: 'right',
                transition: 'background-color 0.2s',
              }}
            >
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                Next Post →
              </div>
              <div style={{ fontWeight: 600, color: '#333' }}>{nextPost.title as string}</div>
            </Link>
          ) : (
            <div style={{ flex: 1 }} />
          )}
        </nav>
      )}
    </div>
  )
}
