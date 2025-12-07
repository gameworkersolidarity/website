import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import config from '@/payload.config'
import Image from 'next/image'

export const metadata = {
  title: 'Blog - Game Workers Solidarity Platform',
  description: 'Read the latest blog posts from the Game Workers Solidarity Platform.',
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
    <div className="blog-page">
      <div className="blog-container">
        <div className="blog-header">
          <h1>Blog</h1>
          <p className="blog-description">
            Read the latest news, updates, and insights from the Game Workers Solidarity Platform.
          </p>
          <Link href="/blog/feed.xml" className="rss-link">
            Subscribe to RSS Feed
          </Link>
        </div>

        {blogPostsResult.docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            <p>No blog posts published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="blog-grid">
            {blogPostsResult.docs.map((post) => {
              const imageUrl =
                typeof post.image === 'object' && post.image?.url ? post.image.url : null

              if (!post.image || typeof post.image !== 'object' || !post.image.url) return null

              return (
                <article key={post.id} className="blog-card">
                  <Link href={`/blog/${post.slug}`} className="blog-card-link">
                    {imageUrl && (
                      <div className="blog-card-image">
                        <Image
                          src={imageUrl}
                          alt={post.title || ''}
                          width={post.image.width!}
                          height={post.image.height!}
                        />
                      </div>
                    )}
                    <div className="blog-card-content">
                      <h2>{post.title}</h2>
                      {post.byline && <p className="blog-card-byline">{post.byline}</p>}
                      {post.createdAt && (
                        <time className="blog-card-date" dateTime={post.createdAt as string}>
                          {new Date(post.createdAt as string).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                      )}
                    </div>
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
