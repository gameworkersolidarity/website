import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { ActionsTimeline } from '../../components/ActionsTimeline'
import { Event } from '@/payload-types'
import { CampaignTimeline } from '../../components/CampaignTimeline'
import { RichText } from '../../components/RichText'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const campaignsResult = await payload.find({
    collection: 'campaigns',
    where: {
      _status: {
        equals: 'published',
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
    title: `${campaign.name} - Campaigns - Game Workers Solidarity Platform`,
    description: `Learn about the ${campaign.name} campaign and its timeline of solidarity actions.`,
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

  // Sort by displayOrder, then by date
  const sortedTimelineEvents = campaignResult.docs[0].events?.sort((a, b) => {
    return new Date((a as Event).date).getTime() - new Date((b as Event).date).getTime()
    return 0
  })

  // const featuredImage =
  //   typeof campaign.featuredImage === 'object' && campaign.featuredImage?.url
  //     ? campaign.featuredImage.url
  //     : null

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
          {campaign.featuredImage && (
            <div className="campaign-featured-image">
              <img src={campaign.featuredImage as string} alt={campaign.name} />
            </div>
          )}

          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            {campaign.name}
          </h1>

          {campaign.description && (
            <div className="campaign-description">
              <RichText data={campaign.description} />
            </div>
          )}

          {sortedTimelineEvents && sortedTimelineEvents.length > 0 && (
            <>
              <div style={{ marginTop: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Events</h2>
                <ActionsTimeline
                  events={sortedTimelineEvents
                    .map((event) => event as Event)
                    .sort(
                      (a, b) =>
                        new Date((b as Event).date).getTime() -
                        new Date((a as Event).date).getTime(),
                    )}
                />
              </div>
            </>
          )}
        </article>
      </div>
    </div>
  )
}
