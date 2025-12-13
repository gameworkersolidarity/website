import { getPayload } from 'payload'
import config from '@/payload.config'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { LexicalRenderer } from '../components/LexicalRenderer'
import type { Campaign, Event } from '@/payload-types'
import { DateTime } from '@/components/DateTime'
import Image from 'next/image'

export const metadata = {
  title: 'Worker organising campaigns — Game Workers Solidarity Platform',
  description: 'Stories about worker organising in the video game industry.',
}

export default async function CampaignsPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = (await draftMode()).isEnabled

  // Fetch the global data for the description
  const campaignPageData = await payload.findGlobal({
    slug: 'campaignsPage',
    draft: isDraftMode,
  })

  // Fetch all published organising groups with their countries
  const campaignResults = await payload.find({
    collection: 'campaigns',
    where: {
      ...(!isDraftMode
        ? {
            _status: {
              equals: 'published',
            },
          }
        : {}),
    },
    depth: 1, // Include countries
    pagination: false,
    draft: isDraftMode,
  })

  const __campaigns = campaignResults.docs as Campaign[]

  const campaigns = __campaigns.sort((a, b) => {
    const startA = Math.min(
      ...(a.events as Event[])?.map((event) => new Date(event.date).getTime()),
    )
    const startB = Math.min(
      ...(b.events as Event[])?.map((event) => new Date(event.date).getTime()),
    )
    return startA - startB
  })

  return (
    <main className="max-w-xl mx-auto py-5 px-4 flex flex-col gap-4">
      <header className="flex flex-col gap-4">
        <h1 className="text-5xl font-bold font-identity">Campaigns</h1>
        {campaignPageData.description && <LexicalRenderer content={campaignPageData.description} />}
      </header>

      {campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          <p>No campaigns published yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {campaigns.map((campaign) => {
            const imageUrl =
              typeof campaign.featuredImage === 'object' && campaign.featuredImage?.url
                ? campaign.featuredImage.url
                : null

            return (
              <Link
                key={campaign.id}
                href={campaign.path!}
                className="flex flex-col bg-white rounded-xl overflow-hidden"
              >
                <header className="p-4 flex flex-col gap-2">
                  <h2 className="text-2xl font-bold font-identity">{campaign.name}</h2>
                  {campaign.events && campaign.events.length > 0 && (
                    <div className="flex flex-row gap-1">
                      <DateTime date={(campaign.events[0] as Event).date} />
                      <span>to</span>
                      <DateTime
                        date={(campaign.events[campaign.events.length - 1] as Event).date}
                      />
                    </div>
                  )}
                </header>
                {imageUrl &&
                  typeof campaign.featuredImage === 'object' &&
                  campaign.featuredImage?.url && (
                    <Image
                      src={imageUrl}
                      alt={campaign.name || ''}
                      width={campaign.featuredImage.width!}
                      height={campaign.featuredImage.height!}
                      objectFit="cover"
                      className="w-full h-48 object-cover overflow-hidden"
                    />
                  )}
                {campaign.description && (
                  <LexicalRenderer content={campaign.description} className="p-4" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
