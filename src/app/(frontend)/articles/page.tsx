import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import config from '@/payload.config'
import Image from 'next/image'
import { Rss } from 'lucide-react'
import { DateTime } from '@/components/DateTime'

export const metadata = {
  title: 'Articles - Game Workers Solidarity Project',
  description: 'News & articles from the Game Workers Solidarity Project.',
}

export default async function BlogPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch all published blog posts
  const blogPostsResult = await payload.find({
    collection: 'blogPosts',
    where: {
      _status: {
        equals: 'published',
      },
    },
    depth: 2, // Include image relation
    pagination: false,
    sort: '-createdAt', // Sort by createdAt, newest first
  })

  return (
    <main className="max-w-xl mx-auto py-5 px-4 flex flex-col gap-4">
      <header className="flex flex-col gap-4">
        <h1 className="text-5xl font-bold font-identity">Articles</h1>
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
            const imageUrl =
              typeof post.image === 'object' && post.image?.url ? post.image.url : null

            if (!post.image || typeof post.image !== 'object' || !post.image.url) return null

            return (
              <Link
                key={post.id}
                href={post.path!}
                className="flex flex-col bg-white rounded-xl overflow-hidden"
              >
                <header className="p-4">
                  <h2 className="text-2xl font-bold font-identity">{post.title}</h2>
                  <div className="flex flex-row gap-4 mt-1">
                    {post.createdAt && <DateTime date={post.createdAt} />}
                    {post.byline && <div>{post.byline}</div>}
                  </div>
                </header>
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={post.title || ''}
                    width={post.image.width!}
                    height={post.image.height!}
                    objectFit="cover"
                    className="w-full h-48 object-cover overflow-hidden"
                  />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
