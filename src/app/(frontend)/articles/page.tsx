import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Rss } from 'lucide-react'
import { DateTime } from '@/components/DateTime'
import { projectStrings } from '@/project-strings'
import type { Metadata } from 'next'
import { getMediaUrl } from '@/utils/media'
import { payloadUserQuery } from '@/utils/payload.server'
import { DraftBadge } from '@/components/DraftBadge'
import { Button } from '@/components/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Articles'
  const description = 'News & articles from Game Worker Solidarity.'
  const shareImage = `${projectStrings.baseUrl}/images/game-workers-share-card-new.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: shareImage,
          width: 955,
          height: 500,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [shareImage],
    },
  }
}

export default async function BlogPage() {
  // Fetch all published blog posts
  const blogPostsResult = await payloadUserQuery({
    collection: 'blogPosts',
    depth: 2, // Include image relation
    pagination: false,
    sort: '-createdAt', // Sort by createdAt, newest first
  })

  return (
    <main className="max-w-xl mx-auto py-4 md:py-5 px-4 flex flex-col gap-4">
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl md:text-5xl font-bold font-identity">Articles</h1>
        <Link href="/articles/feed.xml" className="link flex flex-row items-center gap-2">
          <Rss className="w-4 h-4 inline-block" />
          <span className="inline-block">RSS Feed</span>
        </Link>
      </header>

      {blogPostsResult.docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          <p>No posts published yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {blogPostsResult.docs.map((post) => {
            const imageUrl = typeof post.image === 'object' ? getMediaUrl(post.image) : null

            return (
              <Link
                key={post.id}
                href={post.path!}
                className="flex flex-col bg-white rounded-xl overflow-hidden space-y-3 py-3"
              >
                <header className="px-4 md:px-5">
                  <h2 className="text-2xl font-bold font-identity flex items-center gap-2 flex-wrap">
                    <span>{post.title}</span>
                    {post._status === 'draft' && <DraftBadge />}
                  </h2>
                  <div className="flex flex-row gap-4 mt-1">
                    {post.date && <DateTime date={post.date} />}
                  </div>
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
                      style={{ objectFit: 'cover' }}
                      className="w-full h-48 object-cover overflow-hidden"
                    />
                  )}
                <div className="px-4 md:px-5">
                  <Button variant="outline">Read more</Button>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
