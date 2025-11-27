import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import config from '@/payload.config'

export const metadata = {
  title: 'Campaigns - Game Workers Solidarity Platform',
  description:
    'Learn about campaigns and timelines of solidarity actions across the global video game industry.',
}

export default async function CampaignsPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch all published campaigns
  const campaignsResult = await payload.find({
    collection: 'campaigns',
    where: {
      _status: {
        equals: 'published',
      },
    },
    depth: 2,
    pagination: false,
    sort: 'createdAt',
  })

  return (
    <div className="campaigns-page">
      <div className="campaigns-container">
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          Campaigns
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
          Explore overarching campaigns and timelines of multiple solidarity actions. Learn about
          how events connect and influence each other.
        </p>

        {campaignsResult.docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            <p>No campaigns published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="campaigns-grid">
            {campaignsResult.docs.map((campaign) => {
              const featuredImage =
                typeof campaign.featuredImage === 'object' && campaign.featuredImage?.url
                  ? campaign.featuredImage.url
                  : null

              return (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.slug}`}
                  className="campaign-card"
                >
                  {featuredImage && (
                    <div className="campaign-card-image">
                      <img src={featuredImage} alt={campaign.name} />
                    </div>
                  )}
                  <div className="campaign-card-content">
                    <h2>{campaign.name}</h2>
                    {campaign.events && campaign.events.length > 0 && (
                      <p className="campaign-card-meta">
                        {campaign.events.length} event{campaign.events.length !== 1 ? 's' : ''} in
                        timeline
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
