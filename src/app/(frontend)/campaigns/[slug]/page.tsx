import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { CampaignTimeline } from '../../components/CampaignTimeline'
import { RichText } from '../../components/RichText'
import '../campaigns.css'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const campaignsResult = await payload.find({
    collection: 'campaigns',
    where: {
      _status: {
        equals: 'published',
      },
      published: {
        equals: true,
      },
    },
    limit: 100,
    depth: 0,
  })

  return campaignsResult.docs.map((campaign) => ({
    slug: campaign.slug,
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const campaignResult = await payload.find({
    collection: 'campaigns',
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
            published: {
              equals: true,
            },
          }
        : {}),
    },
    depth: 0,
    draft: isDraftMode,
    limit: 1,
  })

  if (campaignResult.docs.length === 0) {
    return {
      title: 'Campaign Not Found',
    }
  }

  const campaign = campaignResult.docs[0]
  return {
    title: `${campaign.title} - Campaigns - Game Workers Solidarity Platform`,
    description: `Learn about the ${campaign.title} campaign and its timeline of solidarity actions.`,
  }
}

export default async function CampaignPage({ params }: { params: { slug: string } }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const campaignResult = await payload.find({
    collection: 'campaigns',
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
            published: {
              equals: true,
            },
          }
        : {}),
    },
    depth: 3, // Deep depth to get all event relationships
    draft: isDraftMode,
    limit: 1,
  })

  if (campaignResult.docs.length === 0) {
    notFound()
  }

  const campaign = campaignResult.docs[0]

  // Build the timeline structure with events
  const timelineEvents = campaign.timeline || []

  // Sort by displayOrder, then by date
  const sortedTimelineEvents = [...timelineEvents].sort((a, b) => {
    const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0)
    if (orderDiff !== 0) return orderDiff

    const eventA = typeof a.event === 'object' ? a.event : null
    const eventB = typeof b.event === 'object' ? b.event : null

    if (eventA && eventB) {
      return new Date(eventA.Date).getTime() - new Date(eventB.Date).getTime()
    }
    return 0
  })

  const featuredImage =
    typeof campaign.featuredImage === 'object' && campaign.featuredImage?.url
      ? campaign.featuredImage.url
      : null

  return (
    <div className="campaign-page">
      <div className="campaign-container">
        <Link
          href="/campaigns"
          style={{
            display: 'inline-block',
            marginBottom: '1rem',
            color: '#4A90E2',
            textDecoration: 'none',
          }}
        >
          ← Back to Campaigns
        </Link>

        <article className="campaign-article">
          {featuredImage && (
            <div className="campaign-featured-image">
              <img src={featuredImage} alt={campaign.title} />
            </div>
          )}

          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            {campaign.title}
          </h1>

          {campaign.description && (
            <div className="campaign-description">
              <RichText data={campaign.description as any} />
            </div>
          )}

          {campaign.gallery && campaign.gallery.length > 0 && (
            <div className="campaign-gallery" style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Gallery</h2>
              <div
                className="gallery-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                }}
              >
                {campaign.gallery.map((item: any, index: number) => {
                  const imageUrl =
                    typeof item.image === 'object' && item.image?.url ? item.image.url : null
                  if (!imageUrl) return null

                  return (
                    <figure key={index} style={{ margin: 0 }}>
                      <img
                        src={imageUrl}
                        alt={item.caption || `Gallery image ${index + 1}`}
                        style={{ width: '100%', borderRadius: '8px' }}
                      />
                      {item.caption && (
                        <figcaption
                          style={{
                            marginTop: '0.5rem',
                            fontSize: '0.875rem',
                            color: '#666',
                            textAlign: 'center',
                          }}
                        >
                          {item.caption}
                        </figcaption>
                      )}
                    </figure>
                  )
                })}
              </div>
            </div>
          )}

          {sortedTimelineEvents.length > 0 && (
            <div className="campaign-timeline-section" style={{ marginTop: '3rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Timeline</h2>
              <CampaignTimeline
                timelineEvents={sortedTimelineEvents.map((event) => ({
                  ...event,
                  id: event.id || undefined,
                }))}
              />
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
