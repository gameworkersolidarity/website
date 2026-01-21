import { getPayload } from 'payload'
import config from '@/payload.config'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { LexicalRenderer } from '../components/LexicalRenderer'
import type { Campaign, Action } from '@/payload-types'
import { DateTime } from '@/components/DateTime'
import Image from 'next/image'
import { CampaignLabel } from '@/components/CampaignLabel'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { projectStrings } from '@/project-strings'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = (await draftMode()).isEnabled

  try {
    const campaignPageData = await payload.findGlobal({
      slug: 'campaignsPage',
      draft: isDraftMode,
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
                ? campaign.featuredImage.cloudinary?.secure_url || campaign.featuredImage.url
                : null

            return (
              <Link
                key={campaign.id}
                href={campaign.path!}
                className="flex flex-col bg-white rounded-xl overflow-hidden"
              >
                <header className="p-4 md:p-5 pb-0! flex flex-col gap-2">
                  <h2 className="text-2xl font-bold font-identity">
                    <CampaignLabel campaign={campaign} />
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
                {imageUrl &&
                  typeof campaign.featuredImage === 'object' &&
                  campaign.featuredImage?.url && (
                    <Image
                      src={imageUrl}
                      alt={campaign.name || ''}
                      width={campaign.featuredImage.width!}
                      height={campaign.featuredImage.height!}
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
