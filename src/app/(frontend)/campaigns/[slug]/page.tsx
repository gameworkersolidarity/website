import { notFound } from 'next/navigation'
import { payloadUserQuery } from '@/utils/payload.server'
import { CampaignPage } from './CampaignPage'
import { getSlug } from '@/utils/payloadPath'
import { generateMetadataForSlug } from '@/utils/generateMetadata'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { validatePayloadDocument } from '@/utils/validate-payload'

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
  const { slug } = await params

  const result = await payloadUserQuery({
    collection: 'campaigns',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2,
    pagination: false,
    limit: 1,
  })

  if (result.docs.length === 0) {
    notFound()
  }

  const campaign = validatePayloadDocument('campaigns', result.docs[0])

  return <CampaignPage initialCampaign={campaign} />
}
