import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { CampaignPage } from './CampaignPage'
import { getSlug } from '@/utils/payloadPath'
import { Event } from '@/payload-types'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const pagesResult = await payload.find({
    collection: 'campaigns',
    where: {
      _status: {
        equals: 'published',
      },
    },
    pagination: false,
  })

  return pagesResult.docs.map((page) => ({
    slug: getSlug('campaigns', page),
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
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
    depth: 0,
    draft: isDraftMode,
    limit: 1,
  })

  if (result.docs.length === 0) {
    return {
      title: 'Not found',
    }
  }

  const page = result.docs[0]
  return {
    title: `${page.name} - Game Workers Solidarity Platform`,
    description: `Learn about ${page.name} and its timeline of solidarity actions.`,
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
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
    depth: 1,
    pagination: false,
    draft: isDraftMode,
    limit: 1,
  })

  if (result.docs.length === 0) {
    notFound()
  }

  const campaign = result.docs[0]

  const events = await payload.find({
    collection: 'events',
    where: {
      campaigns: {
        equals: campaign.id,
      },
    },
    depth: 1,
  })

  return <CampaignPage initialCampaign={campaign} events={events.docs} />
}
