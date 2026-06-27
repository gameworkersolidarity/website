'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Action, BlogPost } from '@/payload-types'

export default function StatsWidget() {
  const [actionCount, setActionCount] = useState<number | null>(null)
  const [submissions, setSubmissions] = useState<Action[]>([])
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAllData() {
      try {
        // Fetch action count
        const countResponse = await fetch('/api/actions?pagination=false', {
          credentials: 'include',
        })
        if (countResponse.ok) {
          const countData = await countResponse.json()
          setActionCount(countData.totalDocs || 0)
        }

        // Fetch recent submissions
        const submissionsParams = new URLSearchParams({
          limit: '5',
          'where[_status][equals]': 'draft',
          'where[submissionContactDetails][exists]': 'true',
          sort: '-createdAt',
        })
        const submissionsResponse = await fetch(`/api/actions?${submissionsParams.toString()}`, {
          credentials: 'include',
        })
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json()
          setSubmissions(submissionsData.docs || [])
        }

        // Fetch recent blog posts
        const postsParams = new URLSearchParams({
          limit: '5',
          'where[_status][equals]': 'published',
          sort: '-date',
        })
        const postsResponse = await fetch(`/api/blogPosts?${postsParams.toString()}`, {
          credentials: 'include',
        })
        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          setPosts(postsData.docs || [])
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          padding: '1.5rem',
          background: 'var(--theme-elevation-50)',
          borderRadius: '4px',
          boxSizing: 'border-box',
          margin: 0,
        }}
      >
        <div
          style={{
            fontSize: '1rem',
            fontWeight: '500',
            color: 'var(--theme-text)',
            marginBottom: '1rem',
          }}
        >
          Statistics
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--theme-text)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        padding: '1.5rem',
        background: 'var(--theme-elevation-50)',
        borderRadius: '4px',
        boxSizing: 'border-box',
        margin: 0,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
          width: '100%',
        }}
      >
        {/* Action Count */}
        <div
          style={{ padding: '1rem', background: 'var(--theme-elevation-100)', borderRadius: '4px' }}
        >
          <div style={{ fontSize: '0.875rem', color: 'var(--theme-text)', marginBottom: '0.5rem' }}>
            Total Actions
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--theme-success-500)' }}>
            {(actionCount ?? 0).toLocaleString()}
          </div>
          <Link
            href="/admin/collections/actions"
            style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--theme-success-500)',
              textDecoration: 'none',
            }}
          >
            View all →
          </Link>
        </div>

        {/* Recent Submissions */}
        <div>
          <div
            style={{
              fontSize: '0.875rem',
              color: 'var(--theme-text)',
              marginBottom: '0.75rem',
              fontWeight: '500',
            }}
          >
            Recent Submissions
          </div>
          {submissions.length === 0 ? (
            <div style={{ fontSize: '0.875rem', color: 'var(--theme-text-muted)' }}>
              No recent submissions
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {submissions.map((submission) => (
                  <Link
                    key={submission.id}
                    href={`/admin/collections/actions/${submission.id}`}
                    style={{
                      display: 'block',
                      padding: '0.5rem',
                      background: 'var(--theme-elevation-100)',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: 'var(--theme-text)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                      {submission.name || 'Untitled Action'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                      {submission.date ? new Date(submission.date).toLocaleDateString() : 'No date'}
                      {submission.location && ` • ${submission.location}`}
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/admin/collections/actions?where[_status][equals]=draft&where[submissionContactDetails][exists]=true"
                style={{
                  display: 'inline-block',
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                  color: 'var(--theme-success-500)',
                  textDecoration: 'none',
                }}
              >
                View all submissions →
              </Link>
            </>
          )}
        </div>

        {/* Recent Blog Posts */}
        <div>
          <div
            style={{
              fontSize: '0.875rem',
              color: 'var(--theme-text)',
              marginBottom: '0.75rem',
              fontWeight: '500',
            }}
          >
            Recent Blog Posts
          </div>
          {posts.length === 0 ? (
            <div style={{ fontSize: '0.875rem', color: 'var(--theme-text-muted)' }}>
              No recent blog posts
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/admin/collections/blogPosts/${post.id}`}
                    style={{
                      display: 'block',
                      padding: '0.5rem',
                      background: 'var(--theme-elevation-100)',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: 'var(--theme-text)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                      {post.title || 'Untitled Post'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                      {post.date ? new Date(post.date).toLocaleDateString() : 'No date'}
                      {post.byline && ` • ${post.byline}`}
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/admin/collections/blogPosts"
                style={{
                  display: 'inline-block',
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                  color: 'var(--theme-success-500)',
                  textDecoration: 'none',
                }}
              >
                View all posts →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
