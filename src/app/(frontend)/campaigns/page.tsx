import { payloadUserGlobalQuery } from '@/utils/payload.server'
import { LexicalRenderer } from '../components/LexicalRenderer'
import type { Campaign, Action } from '@/payload-types'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { projectStrings } from '@/project-strings'
import type { Metadata } from 'next'
import { payloadUserQuery } from '@/utils/payload.server'
import { CampaignsGrid } from './CampaignsGrid.client'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const campaignPageData = await payloadUserGlobalQuery({
      slug: 'campaignsPage',
    })

    const title = 'Game worker organising campaigns'
    const description =
      (campaignPageData?.description ? lexicalToPlainText(campaignPageData.description) : '') ||
      'Worker organising campaigns in the video game industry.'
    const shareImage = `${projectStrings.baseUrl}/images/game-workers-share-card-new.png`

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
    const description = 'Worker organising campaigns in the video game industry.'
    const shareImage = `${projectStrings.baseUrl}/images/game-workers-share-card-new.png`

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

  // Create a dictionary of campaigns with their date ranges
  const campaignDateRanges: Record<string, { earliestDate: Date; latestDate: Date }> = {}

  __campaigns.forEach((campaign) => {
    if (campaign.actions && campaign.actions.length > 0) {
      const dates = (campaign.actions as Action[]).map((action) => new Date(action.date).getTime())
      campaignDateRanges[campaign.id] = {
        earliestDate: new Date(Math.min(...dates)),
        latestDate: new Date(Math.max(...dates)),
      }
    }
  })

  // Sort campaigns by latest date first, then earliest date
  const campaigns = __campaigns.sort((a, b) => {
    const rangeA = campaignDateRanges[a.id]
    const rangeB = campaignDateRanges[b.id]

    if (!rangeA && !rangeB) return 0
    if (!rangeA) return 1
    if (!rangeB) return -1

    // Sort by latest date first (descending)
    const latestDiff = rangeB.latestDate.getTime() - rangeA.latestDate.getTime()
    if (latestDiff !== 0) return latestDiff

    // If latest dates are equal, sort by earliest date (descending)
    return rangeB.earliestDate.getTime() - rangeA.earliestDate.getTime()
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
        <CampaignsGrid campaigns={campaigns} dateRanges={campaignDateRanges} />
      )}
    </main>
  )
}
