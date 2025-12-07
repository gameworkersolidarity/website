import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import Link from 'next/link'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import Image from 'next/image'
import { AdminEditBanner } from '@/components/Me'
import { DateTime } from '@/components/DateTime'
import { RefreshRouteOnSave } from '@/components/RefreshRouteOnSave'
import { projectStrings } from '@/project-strings'

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
    <div>
      <RefreshRouteOnSave />
      <AdminEditBanner page={post} />
      <main className="max-w-2xl mx-auto py-5 px-4 flex flex-col gap-4">
        <Link href="/blog">← Back to Blog</Link>
        <h1 className="text-5xl font-bold font-identity">{post.title}</h1>
        <div className="flex flex-row gap-4 font-mono">
          {post.createdAt && <DateTime date={post.createdAt} />}
          {post.byline && <div>{post.byline}</div>}
        </div>
        {post.image && typeof post.image === 'object' && 'url' in post.image && (
          <Image
            src={post.image.url as string}
            alt={post.title || ''}
            width={post.image.width!}
            height={post.image.height!}
            objectFit="cover"
            className="w-full max-h-48 md:h-auto object-cover"
          />
        )}
        <LexicalRenderer content={post.body} className="text-lg/relaxed" />
        <div className="mt-3 border-t border-gray-200 pt-3 italic opacity-60">
          Want to discuss this post or publish a follow-up on the blog?{' '}
          <Link className="link" href={`mailto:${projectStrings.email}`}>
            Contact us &rarr;
          </Link>
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
                href={previousPost.path!}
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
                href={nextPost.path!}
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
      </main>
    </div>
  )
}
