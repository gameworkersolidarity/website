import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import Link from 'next/link'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import { ActionsTimeline } from '../../components/ActionsTimeline'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const categoriesResult = await payload.find({
    collection: 'categories',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit: 100,
    depth: 0,
  })

  return categoriesResult.docs.map((category) => ({
    slug: category.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const categoryResult = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: slug,
      },
      ...(!isDraftMode
        ? {
            _status: {
              equals: 'published',
            },
          }
        : {}),
    },
    depth: 0,
    draft: isDraftMode,
    limit: 1,
  })

  if (categoryResult.docs.length === 0) {
    return {
      title: 'Category Not Found',
    }
  }

  const category = categoryResult.docs[0]
  return {
    title: `${category.Name} - Categories - Game Workers Solidarity Platform`,
    description: `Explore solidarity actions in the ${category.Name} category.`,
  }
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const category = await payload
    .find({
      collection: 'categories',
      depth: 2, // Include related solidarity actions and their related entities
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

  if (!category) {
    notFound()
  }

  // Query solidarity actions directly where this category is related
  const actionsResult = await payload.find({
    collection: 'solidarityActions',
    where: {
      and: [
        {
          Category: {
            in: [category.id],
          },
        },
        ...(!isDraftMode
          ? [
              {
                _status: {
                  equals: 'published',
                },
              },
            ]
          : []),
      ],
    },
    depth: 2, // Include related entities
    draft: isDraftMode,
    pagination: false,
  })

  const solidarityActions = actionsResult.docs

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          marginBottom: '1rem',
          color: '#4A90E2',
          textDecoration: 'none',
        }}
      >
        ← Back to Home
      </Link>

      <h1>
        {category.Emoji && <span style={{ marginRight: '0.5rem' }}>{category.Emoji}</span>}
        {category.Name}
      </h1>

      {category.Summary && (
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <LexicalRenderer content={category.Summary} />
        </div>
      )}

      {solidarityActions.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Related Solidarity Actions ({solidarityActions.length})
          </h2>
          <ActionsTimeline
            actions={solidarityActions.sort(
              (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime(),
            )}
          />
        </div>
      )}
    </div>
  )
}

