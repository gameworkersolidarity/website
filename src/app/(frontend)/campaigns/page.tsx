import { getCachedData, getCachedGlobalForMetadata } from '@/utils/payload.server'
import { LexicalRenderer } from '../components/LexicalRenderer'
import type { Campaign, Action } from '@/payload-types'
import type { Payload } from 'payload'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { projectStrings } from '@/project-strings'
import type { Metadata } from 'next'
import { CampaignsGrid } from './CampaignsGrid.client'
import { CACHE_KEYS } from '@/lib/cache'

// Segment config must be a literal; value = 12h (see CACHE_REVALIDATE_SECONDS in lib/cache)
export const revalidate = 43200

export async function generateMetadata(): Promise<Metadata> {
  try {
    const campaignPageData = await getCachedGlobalForMetadata<{ description?: unknown }>(
      'campaignsPage',
    )

    const title = 'Game worker organising campaigns'
    const description =
      (campaignPageData?.description != null
        ? lexicalToPlainText(
            campaignPageData.description as Parameters<typeof lexicalToPlainText>[0],
          )
        : '') || 'Worker organising campaigns in the video game industry.'
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

async function getCampaignsPageData(query: Payload['find'], globalQuery: Payload['findGlobal']) {
  const campaignPageData = await globalQuery({ slug: 'campaignsPage' })
  const campaignResults = await query({
    collection: 'campaigns',
    depth: 1,
    pagination: false,
  })
  const __campaigns = campaignResults.docs as Campaign[]
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
  const campaigns = __campaigns.sort((a, b) => {
    const rangeA = campaignDateRanges[a.id]
    const rangeB = campaignDateRanges[b.id]
    if (!rangeA && !rangeB) return 0
    if (!rangeA) return 1
    if (!rangeB) return -1
    const latestDiff = rangeB.latestDate.getTime() - rangeA.latestDate.getTime()
    if (latestDiff !== 0) return latestDiff
    return rangeB.earliestDate.getTime() - rangeA.earliestDate.getTime()
  })
  return { campaignPageData, campaigns, campaignDateRanges }
}

export default async function CampaignsPage() {
  const { campaignPageData, campaigns, campaignDateRanges } = await getCachedData(
    CACHE_KEYS.CAMPAIGNS_INDEX,
    ({ query, globalQuery }) => getCampaignsPageData(query, globalQuery),
  )

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
