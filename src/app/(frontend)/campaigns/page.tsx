import { getPayload } from 'payload'
import config from '@/payload.config'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { LexicalRenderer } from '../components/LexicalRenderer'
import type { Campaign } from '@/payload-types'
import { DateTime } from '@/components/DateTime'
import Image from 'next/image'

export const metadata = {
  title: 'Start Organising - Game Workers Solidarity Platform',
  description:
    'Find organising groups and unions by country to get started with worker organising.',
}

export default async function StartOrganisingPage() {
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
    sort: 'name',
    draft: isDraftMode,
  })

  const __campaigns = campaignResults.docs as Campaign[]

  const campaigns = __campaigns.sort((a, b) => {
    if (a.eventDateRange?.start && b.eventDateRange?.start) {
      return new Date(a.eventDateRange.start).getTime() - new Date(b.eventDateRange.start).getTime()
    }
    return 0
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

            if (
              !campaign.featuredImage ||
              typeof campaign.featuredImage !== 'object' ||
              !campaign.featuredImage.url
            )
              return null

            return (
              <Link
                key={campaign.id}
                href={campaign.path!}
                className="flex flex-col bg-white rounded-xl overflow-hidden"
              >
                <header className="p-4 flex flex-col gap-2">
                  <h2 className="text-2xl font-bold font-identity">{campaign.name}</h2>
                  {campaign.eventDateRange?.start && campaign.eventDateRange?.end && (
                    <div className="flex flex-row gap-1">
                      {campaign.eventDateRange?.start && (
                        <DateTime date={campaign.eventDateRange.start} />
                      )}
                      <span>to</span>
                      <DateTime date={campaign.eventDateRange.end} />
                    </div>
                  )}
                </header>
                {imageUrl && (
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
