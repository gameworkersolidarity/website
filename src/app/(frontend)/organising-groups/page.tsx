import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import config from '@/payload.config'

export const metadata = {
  title: 'Organising Groups - Game Workers Solidarity Platform',
  description:
    'Explore unions and organising groups active in solidarity actions across the global video game industry.',
}

export default async function OrganisingGroupsPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch all published organising groups
  const groupsResult = await payload.find({
    collection: 'organisingGroups',
    where: {
      _status: {
        equals: 'published',
      },
    },
    depth: 0,
    pagination: false,
    sort: 'Name',
  })

  // Count actions for each group and filter out groups with no actions
  const groupsWithActions = await Promise.all(
    groupsResult.docs.map(async (group) => {
      const actionsResult = await payload.find({
        collection: 'events',
        sort: 'date:desc',
        where: {
          and: [
            {
              organisingGroups: {
                in: [group.id],
              },
            },
            {
              _status: {
                equals: 'published',
              },
            },
          ],
        },
        limit: 1,
        depth: 0,
      })
      return {
        group,
        actionCount: actionsResult.totalDocs,
      }
    }),
  )

  const filteredGroups = groupsWithActions.filter((item) => item.actionCount > 0)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        Organising Groups
      </h1>
      <p
        style={{
          fontSize: '1.125rem',
          color: '#666',
          marginBottom: '3rem',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto 3rem',
        }}
      >
        Explore unions and organising groups active in solidarity actions across the global video
        game industry.
      </p>

      {filteredGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          <p>No organising groups with solidarity actions found. Check back soon!</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredGroups.map(({ group, actionCount }) => (
            <Link
              key={group.id}
              href={`/organising-groups/${group.slug}`}
              style={{
                display: 'block',
                padding: '1.5rem',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s',
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#4A90E2',
                }}
              >
                {group.fullName || group.name}
              </h2>
              {group.isUnion && (
                <p
                  style={{ fontSize: '0.875rem', color: '#4A90E2', margin: 0, fontWeight: 'bold' }}
                >
                  Union
                </p>
              )}
              <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                {actionCount} action{actionCount !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
