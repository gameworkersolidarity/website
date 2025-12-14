import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { CampaignPage } from './CampaignPage'
import { getSlug } from '@/utils/payloadPath'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { Media } from '@/payload-types'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const pagesResult = await payload.find({
    collection: 'campaigns',
    pagination: false,
  })

  return pagesResult.docs
    .map((page) => ({
      slug: getSlug('campaigns', page),
    }))
    .filter((page) => !!page.slug)
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

  const title = page.name
  const description = page.description
    ? lexicalToPlainText(page.description)
    : `Learn more about worker organising in the video game industry.`
  const images = page.featuredImage
    ? [(page.featuredImage as Media).cloudinary?.secure_url || (page.featuredImage as Media).url]
    : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
    },
    twitter: {
      title,
      description,
      images,
    },
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
