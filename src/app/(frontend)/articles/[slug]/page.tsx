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
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'
import {
  validatePayloadDocument,
  validatePayloadResult,
  validatePayloadDocuments,
} from '@/utils/validate-payload'
import type { Action } from '@/payload-types'
import { ArticleActionsSidebar } from './ArticleActionsSidebar'
import { ArticleSameDayActions } from './ArticleSameDayActions'

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
    depth: 2, // Include image + relatedActions (actions populated)
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

  const articleDate = post.date ?? new Date().toISOString()

  // Related actions (editor-curated) – only these appear in sidebars
  const relatedActionsRaw = post.relatedActions ?? []
  const relatedActions: Action[] = relatedActionsRaw
    .filter((a): a is Action => typeof a === 'object' && a !== null && 'date' in a && 'path' in a)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const previousActions: Action[] = relatedActions
    .filter((a) => new Date(a.date) < new Date(articleDate))
    .reverse()
  const nextActions: Action[] = relatedActions.filter(
    (a) => new Date(a.date) > new Date(articleDate),
  )

  const sameDayResult = await payloadUserQuery({
    collection: 'actions',
    where: { date: { equals: articleDate } },
    depth: 2,
  })
  const sameDayActions = validatePayloadDocuments('actions', sameDayResult.docs)

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
    <div className="bg-gwBackground flex-1 flex flex-col" style={{ minHeight: '66vh' }}>
      <RefreshRouteOnSave />
      <AdminEditBanner page={post} />
      <div className="mx-auto py-4 md:py-5 px-4 grid grid-cols-2 lg:grid-cols-[1fr_3fr_1fr] gap-4 mb-auto w-full max-w-6xl">
        <ArticleActionsSidebar
          side="previous"
          actions={previousActions}
          articleDate={articleDate}
        />
        <main className="col-span-2 lg:col-span-1 flex flex-col gap-4">
          <Link href="/articles">
            <Button variant="outline" className="opacity-70 hover:opacity-100 transition-opacity">
              <ArrowLeftIcon className="w-4 h-4" />
              All articles
            </Button>
          </Link>
          <section className="bg-white rounded-xl p-4 md:p-6 space-y-4">
            <header>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm uppercase opacity-50">
                <span className="flex items-center gap-2">
                  Article
                  {post._status === 'draft' && <DraftBadge />}
                </span>
                {post.date && (
                  <>
                    <span aria-hidden className="opacity-40">
                      ·
                    </span>
                    <DateTime date={post.date} />
                  </>
                )}
                {post.byline && (
                  <>
                    <span aria-hidden className="opacity-40">
                      ·
                    </span>
                    <span>{post.byline}</span>
                  </>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold font-identity mt-2 flex items-center gap-2 flex-wrap">
                <span>{post.title}</span>
              </h1>
            </header>
            {imageUrl &&
              typeof post.image === 'object' &&
              post.image?.width &&
              post.image?.height && (
                <Image
                  src={imageUrl}
                  alt={post.title || ''}
                  width={post.image.width}
                  height={post.image.height}
                  objectFit="cover"
                  className="w-full max-h-48 md:h-auto object-cover rounded-lg overflow-hidden"
                />
              )}
            <LexicalRenderer content={post.body} className="text-lg/relaxed" />
            {sameDayActions.length > 0 && (
              <ArticleSameDayActions sameDayActions={sameDayActions} articleDate={articleDate} />
            )}
            <div className="mt-3 border-t border-gray-200 pt-3 italic opacity-60">
              Want to discuss this post or publish a follow-up on the post?{' '}
              <Link className="link" href={`mailto:${projectStrings.email}`}>
                Contact us &rarr;
              </Link>
            </div>

            {/* Previous/Next Navigation */}
            {(previousPost || nextPost) && (
              <nav className="flex justify-between gap-8">
                {previousPost ? (
                  <Link
                    href={previousPost.path!}
                    className="flex-1 p-4 bg-gray-100 rounded-lg no-underline text-inherit transition-colors hover:bg-gray-200"
                  >
                    <div className="text-sm text-gray-600 mb-2">← Previous Post</div>
                    <div className="font-semibold text-gray-800">
                      {previousPost.title as string}
                    </div>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}

                {nextPost ? (
                  <Link
                    href={nextPost.path!}
                    className="flex-1 p-4 bg-gray-100 rounded-lg no-underline text-inherit text-right transition-colors hover:bg-gray-200"
                  >
                    <div className="text-sm text-gray-600 mb-2">Next Post →</div>
                    <div className="font-semibold text-gray-800">{nextPost.title as string}</div>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
              </nav>
            )}
          </section>
        </main>
        <ArticleActionsSidebar side="next" actions={nextActions} articleDate={articleDate} />
      </div>
    </div>
  )
}
