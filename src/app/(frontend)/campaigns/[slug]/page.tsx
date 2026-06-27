import { notFound } from 'next/navigation'
import { getCachedDataForSlug } from '@/utils/payload.server'
import { CampaignPage } from './CampaignPage'
import { generateMetadataForSlug } from '@/utils/generateMetadata'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { validatePayloadDocument } from '@/utils/validate-payload'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateMetadataForSlug({
    collection: 'campaigns',
    slug,
    getDescription: async (record: any) => {
      if (record.description) {
        const descText = lexicalToPlainText(record.description)
        if (descText) {
          return descText.length > 300 ? descText.substring(0, 297) + '...' : descText
        }
      }
      return `Explore the ${record.name || 'campaign'} and learn about worker organising in the video game industry.`
    },
  })
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const result = await getCachedDataForSlug('campaigns', slug, async ({ query }) => {
    const res = await query({
      collection: 'campaigns',
      where: { slug: { equals: slug } },
      depth: 2,
      pagination: false,
      limit: 1,
    })
    if (res.docs.length === 0) return null
    const campaign = validatePayloadDocument('campaigns', res.docs[0])
    return campaign
  })

  if (!result) notFound()

  return <CampaignPage initialCampaign={result} />
}
