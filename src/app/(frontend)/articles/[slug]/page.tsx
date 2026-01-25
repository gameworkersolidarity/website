import { notFound } from 'next/navigation'
import { payloadUserQuery } from '@/utils/payload.server'
import React from 'react'
import Link from 'next/link'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import Image from 'next/image'
import { AdminEditBanner } from '@/components/Me'
import { DateTime } from '@/components/DateTime'
import { RefreshRouteOnSave } from '@/components/RefreshRouteOnSave'
import { projectStrings } from '@/project-strings'
import { generateMetadataForSlug } from '@/utils/generateMetadata'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { getMediaUrl } from '@/utils/media'
import { DraftBadge } from '@/components/DraftBadge'
import { validatePayloadDocument, validatePayloadResult } from '@/utils/validate-payload'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateMetadataForSlug({
    collection: 'blogPosts',
    slug,
    notFoundTitle: 'Article Not Found',
    getDescription: async (record: any) => {
      // Extract summary from body content
      if (record.body) {
        const bodyText = lexicalToPlainText(record.body)
        if (bodyText) {
          // Take first paragraph or first 300 characters for share card
          const firstParagraph = bodyText.split('\n\n')[0] || bodyText.split('\n')[0] || bodyText
          const summary =
            firstParagraph.length > 300 ? firstParagraph.substring(0, 297) + '...' : firstParagraph

          if (summary.trim()) {
            return summary.trim()
          }
        }
      }

      // Fallback
      return `Read about worker organising in the video game industry.`
    },
  })
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params

  const postResult = await payloadUserQuery({
    collection: 'blogPosts',
    depth: 2, // Include image relation
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  if (!postResult.docs[0]) {
    notFound()
  }

  const post = validatePayloadDocument('blogPosts', postResult.docs[0])

  // Fetch all published blog posts to find previous/next
  const allPostsResult = await payloadUserQuery({
    collection: 'blogPosts',
    sort: 'createdAt', // Sort by createdAt, newest first
    pagination: false,
  })

  const allPosts = validatePayloadResult('blogPosts', allPostsResult)

  // Find current post index and get previous/next
  const currentIndex = allPosts.docs.findIndex((p) => p.id === post.id)
  const previousPost = currentIndex > 0 ? allPosts.docs[currentIndex - 1] : null
  const nextPost =
    currentIndex >= 0 && currentIndex < allPosts.docs.length - 1
      ? allPosts.docs[currentIndex + 1]
      : null

  const imageUrl = post.image && typeof post.image === 'object' ? getMediaUrl(post.image) : null

  return (
    <div>
      <RefreshRouteOnSave />
      <AdminEditBanner page={post} />
      <main className="max-w-2xl mx-auto py-4 md:py-5 px-4 flex flex-col gap-4">
        <Link href="/articles">← All articles</Link>
        <h1 className="text-4xl md:text-5xl font-bold font-identity flex items-center gap-2 flex-wrap">
          <span>{post.title}</span>
          {post._status === 'draft' && <DraftBadge />}
        </h1>
        <div className="flex flex-row gap-4 font-mono">
          {post.createdAt && <DateTime date={post.createdAt} />}
          {post.byline && <div>{post.byline}</div>}
        </div>
        {imageUrl && typeof post.image === 'object' && post.image?.width && post.image?.height && (
          <Image
            src={imageUrl}
            alt={post.title || ''}
            width={post.image.width}
            height={post.image.height}
            objectFit="cover"
            className="w-full max-h-48 md:h-auto object-cover"
          />
        )}
        <LexicalRenderer content={post.body} className="text-lg/relaxed" />
        <div className="mt-3 border-t border-gray-200 pt-3 italic opacity-60">
          Want to discuss this post or publish a follow-up on the post?{' '}
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
