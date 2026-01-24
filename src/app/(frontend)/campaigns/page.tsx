import { payloadUserGlobalQuery } from '@/utils/payload.server'
import Link from 'next/link'
import { LexicalRenderer } from '../components/LexicalRenderer'
import type { Campaign, Action } from '@/payload-types'
import { DateTime } from '@/components/DateTime'
import Image from 'next/image'
import { CampaignLabel } from '@/components/CampaignLabel'
import { DraftBadge } from '@/components/DraftBadge'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { projectStrings } from '@/project-strings'
import type { Metadata } from 'next'
import { getMediaUrl } from '@/utils/media'
import { payloadUserQuery } from '@/utils/payload.server'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const campaignPageData = await payloadUserGlobalQuery({
      slug: 'campaignsPage',
    })

    const title = 'Worker organising campaigns'
    const description =
      (campaignPageData?.description ? lexicalToPlainText(campaignPageData.description) : '') ||
      'Stories about worker organising in the video game industry.'
    const shareImage = `${projectStrings.baseUrl}/icon/icon.png`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: shareImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [shareImage],
      },
    }
  } catch (error) {
    const title = 'Worker organising campaigns'
    const description = 'Stories about worker organising in the video game industry.'
    const shareImage = `${projectStrings.baseUrl}/icon/icon.png`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: shareImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [shareImage],
      },
    }
  }
}

export default async function CampaignsPage() {
  // Fetch the global data for the description
  const campaignPageData = await payloadUserGlobalQuery({
    slug: 'campaignsPage',
  })

  // Fetch all published organising groups with their countries
  const campaignResults = await payloadUserQuery({
    collection: 'campaigns',
    depth: 1, // Include countries
    pagination: false,
  })

  const __campaigns = campaignResults.docs as Campaign[]

  const campaigns = __campaigns.sort((a, b) => {
    if (!a.actions || !b.actions) return 0
    const startA = Math.min(
      ...(a.actions as Action[])?.map((action) => new Date(action.date).getTime()),
    )
    const startB = Math.min(
      ...(b.actions as Action[])?.map((action) => new Date(action.date).getTime()),
    )
    return startA - startB
  })

  return (
    <main className="max-w-xl mx-auto py-5 px-4 flex flex-col gap-4">
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl md:text-5xl font-bold font-identity">Campaigns</h1>
        {campaignPageData?.description && (
          <LexicalRenderer content={campaignPageData.description} />
        )}
      </header>

      {campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          <p>No campaigns published yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {campaigns.map((campaign) => {
            const featuredMedia =
              typeof campaign.featuredImage === 'object' ? campaign.featuredImage : null
            const imageUrl = featuredMedia ? getMediaUrl(featuredMedia) : null

            return (
              <Link
                key={campaign.id}
                href={campaign.path!}
                className="flex flex-col bg-white rounded-xl overflow-hidden"
              >
                <header className="p-4 md:p-5 pb-0! flex flex-col gap-2">
                  <h2 className="text-2xl font-bold font-identity flex items-center gap-2 flex-wrap">
                    <CampaignLabel campaign={campaign} />
                    {campaign._status === 'draft' && <DraftBadge />}
                  </h2>
                  {campaign.actions && campaign.actions.length > 0 && (
                    <div className="flex flex-row gap-1">
                      <DateTime date={(campaign.actions[0] as Action).date} />
                      <span>to</span>
                      <DateTime
                        date={(campaign.actions[campaign.actions.length - 1] as Action).date}
                      />
                    </div>
                  )}
                </header>
                {imageUrl && typeof campaign.featuredImage === 'object' && (
                  <Image
                    src={imageUrl}
                    alt={campaign.name || ''}
                    width={featuredMedia?.width || 1000}
                    height={featuredMedia?.height || 1000}
                    objectFit="cover"
                    className="w-full h-60 object-cover overflow-hidden my-4"
                  />
                )}
                {campaign.description && (
                  <LexicalRenderer content={campaign.description} className="p-4 md:p-5 pt-3!" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
