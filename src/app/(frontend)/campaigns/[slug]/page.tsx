import { fetchDraftMode } from '@/utils/auth'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { CampaignPage } from './CampaignPage'
import { getSlug } from '@/utils/payloadPath'
import { generateMetadataForSlug } from '@/utils/generateMetadata'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateMetadataForSlug({
    collection: 'campaigns',
    slug,
    getDescription: async (record: any) => {
      // Use description if available
      if (record.description) {
        const descText = lexicalToPlainText(record.description)
        if (descText) {
          // Truncate to fit share card (max ~300 chars for campaigns)
          return descText.length > 300 ? descText.substring(0, 297) + '...' : descText
        }
      }

      // Fallback with campaign name
      return `Explore the ${record.name || 'campaign'} and learn about worker organising in the video game industry.`
    },
  })
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = await fetchDraftMode(payload)
  const { slug } = await params

  const result = await payload.find({
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
    depth: 2,
    pagination: false,
    draft: isDraftMode,
    limit: 1,
  })

  if (result.docs.length === 0) {
    notFound()
  }

  const campaign = result.docs[0]

  return <CampaignPage initialCampaign={campaign} />
}
