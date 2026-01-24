'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface Version {
  id: string
  createdAt: string
  updatedAt: string
  parent: string
  version: {
    id: string
    [key: string]: any
  }
  autosave?: boolean
  _status?: 'draft' | 'published'
  createdBy?:
    | string
    | {
        id: string
        email?: string
        name?: string
      }
}

interface VersionWithCollection extends Version {
  collection: string
  collectionLabel: string
  documentTitle: string
  documentId: string
  userName?: string
  userEmail?: string
  userId?: string
  type: 'collection' | 'global'
}

type CollectionItem = {
  slug: string
  label: string
  type: 'collection' | 'global'
}

const COLLECTIONS: CollectionItem[] = [
  { slug: 'actions', label: 'Actions', type: 'collection' },
  { slug: 'blogPosts', label: 'Blog Posts', type: 'collection' },
  { slug: 'companies', label: 'Companies', type: 'collection' },
  { slug: 'organisingGroups', label: 'Organising Groups', type: 'collection' },
  { slug: 'categories', label: 'Categories', type: 'collection' },
  { slug: 'countries', label: 'Countries', type: 'collection' },
  { slug: 'campaigns', label: 'Campaigns', type: 'collection' },
  { slug: 'staticPages', label: 'Static Pages', type: 'collection' },
  // Note: Users collection doesn't have versions enabled, so it's excluded
  // globals
  { slug: 'header', label: 'Header', type: 'global' },
  { slug: 'footer', label: 'Footer', type: 'global' },
  { slug: 'startOrganising', label: 'Start Organising', type: 'global' },
  { slug: 'aboutPage', label: 'About Page', type: 'global' },
  { slug: 'campaignsPage', label: 'Campaigns Page', type: 'global' },
  { slug: 'dataPage', label: 'Data Page', type: 'global' },
  { slug: 'actionSubmissionPage', label: 'Action Submission Page', type: 'global' },
]

export default function RecentEditsWidget() {
  const [recentEdits, setRecentEdits] = useState<VersionWithCollection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentEdits() {
      try {
        const allVersions: VersionWithCollection[] = []

        // Fetch versions from all collections and globals
        for (const item of COLLECTIONS) {
          try {
            const params = new URLSearchParams({
              limit: '10',
              sort: '-createdAt',
              depth: '3', // Increase depth to ensure createdBy is populated
            })
            // Use different API endpoints for collections vs globals
            const apiUrl =
              item.type === 'global'
                ? `/api/globals/${item.slug}/versions?${params.toString()}`
                : `/api/${item.slug}/versions?${params.toString()}`
            const response = await fetch(apiUrl, {
              credentials: 'include',
            })

            if (response.ok) {
              const data = await response.json()
              const versions: Version[] = data.docs || []

              // Transform versions to include collection info
              for (const version of versions) {
                // Get document title from version data
                // For globals, use the label as the title since they're singletons
                let documentTitle = item.type === 'global' ? item.label : 'Untitled'
                if (version.version && item.type === 'collection') {
                  // Try common title fields for collections
                  // For users, the title field is 'email'
                  if (item.slug === 'users') {
                    documentTitle = version.version.email || 'Untitled User'
                  } else {
                    documentTitle =
                      version.version.name ||
                      version.version.title ||
                      version.version.slug ||
                      'Untitled'
                  }
                }

                // Get user name/email
                let userName: string | undefined
                let userEmail: string | undefined
                let userId: string | undefined

                if (version.createdBy) {
                  if (typeof version.createdBy === 'string') {
                    // If it's just an ID, we'll fetch the user separately
                    userId = version.createdBy
                  } else if (typeof version.createdBy === 'object' && version.createdBy !== null) {
                    // User object is populated
                    userEmail = version.createdBy.email
                    // Users might not have a name field, so use email as fallback
                    userName = version.createdBy.name || version.createdBy.email
                    userId = version.createdBy.id
                  }
                }

                allVersions.push({
                  ...version,
                  collection: item.slug,
                  collectionLabel: item.label,
                  documentTitle,
                  documentId: version.parent || item.slug, // For globals, parent might be empty, use slug
                  userName,
                  userEmail,
                  userId,
                  type: item.type as 'collection' | 'global',
                })
              }
            } else if (response.status !== 404) {
              // 404 is expected if versions endpoint doesn't exist
              console.warn(
                `Failed to fetch versions for ${item.slug}: ${response.status} ${response.statusText}`,
              )
            }
          } catch (error) {
            // Silently handle errors - some collections/globals might not have versions enabled
            console.debug(`Error fetching versions for ${item.slug}:`, error)
          }
        }

        // Fetch user details for versions where createdBy is just an ID
        const userIdsToFetch = new Set<string>()
        allVersions.forEach((version) => {
          if (version.userId && !version.userName) {
            userIdsToFetch.add(version.userId)
          }
        })

        // Fetch user details in batch
        if (userIdsToFetch.size > 0) {
          try {
            const userIdsArray = Array.from(userIdsToFetch).filter((id): id is string => !!id)
            if (userIdsArray.length > 0) {
              const userParams = new URLSearchParams({
                where: JSON.stringify({
                  id: { in: userIdsArray },
                }),
                limit: userIdsArray.length.toString(),
              })
              const usersResponse = await fetch(`/api/users?${userParams.toString()}`, {
                credentials: 'include',
              })

              if (usersResponse.ok) {
                const usersData = await usersResponse.json()
                const users: Array<{ id: string; name?: string; email?: string }> =
                  usersData.docs || []
                const userMap = new Map<string, { name?: string; email?: string }>(
                  users.map((user) => [user.id, { name: user.name, email: user.email }]),
                )

                // Update versions with user information
                allVersions.forEach((version) => {
                  if (version.userId && !version.userName) {
                    const user = userMap.get(version.userId)
                    if (user) {
                      version.userEmail = user.email
                      version.userName = user.name || user.email
                    }
                  }
                })
              }
            }
          } catch (error) {
            console.debug('Error fetching user details:', error)
          }
        }

        // Sort all versions by createdAt (most recent first)
        allVersions.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return dateB - dateA
        })

        // Take the 10 most recent
        setRecentEdits(allVersions.slice(0, 10))
      } catch (error) {
        console.error('Error fetching recent edits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentEdits()
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
          Recent Edits
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
          fontSize: '1rem',
          fontWeight: '500',
          color: 'var(--theme-text)',
          marginBottom: '1rem',
        }}
      >
        Recent Edits
      </div>
      {recentEdits.length === 0 ? (
        <div style={{ fontSize: '0.875rem', color: 'var(--theme-text-muted)' }}>
          No recent edits found
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentEdits.map((edit) => {
              // Generate correct admin link based on type
              const adminLink =
                edit.type === 'global'
                  ? `/admin/globals/${edit.collection}`
                  : `/admin/collections/${edit.collection}/${edit.documentId}`
              return (
                <Link
                  key={`${edit.collection}-${edit.id}`}
                  href={adminLink}
                  style={{
                    display: 'block',
                    padding: '0.75rem',
                    background: 'var(--theme-elevation-100)',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: 'var(--theme-text)',
                    fontSize: '0.875rem',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--theme-elevation-200)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--theme-elevation-100)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                        {edit.documentTitle}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                        <div style={{ marginBottom: '0.25rem' }}>
                          <span style={{ textTransform: 'capitalize' }}>
                            {edit.collectionLabel}
                          </span>
                          {edit.autosave && (
                            <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>
                              (autosave)
                            </span>
                          )}
                          {edit._status && (
                            <span
                              style={{
                                marginLeft: '0.5rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '2px',
                                background:
                                  edit._status === 'published'
                                    ? 'var(--theme-success-500)'
                                    : 'var(--theme-warning-500)',
                                color: 'white',
                                fontSize: '0.625rem',
                                textTransform: 'uppercase',
                              }}
                            >
                              {edit._status}
                            </span>
                          )}
                        </div>
                        {(edit.userName || edit.userEmail) && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--theme-text)',
                              fontWeight: '500',
                              marginTop: '0.25rem',
                            }}
                          >
                            {edit.userName && edit.userName !== edit.userEmail ? (
                              <>
                                {edit.userName}
                                {edit.userEmail && (
                                  <span
                                    style={{
                                      color: 'var(--theme-text-muted)',
                                      marginLeft: '0.5rem',
                                    }}
                                  >
                                    ({edit.userEmail})
                                  </span>
                                )}
                              </>
                            ) : (
                              edit.userEmail || edit.userName
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--theme-text-muted)',
                        marginLeft: '1rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(edit.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
