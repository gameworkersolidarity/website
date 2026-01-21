import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { CollectionSlug } from 'payload'
import config from '@/payload.config'
import { getSlug } from '@/utils/payloadPath'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { Media, Config } from '@/payload-types'
import { capitalize } from 'lodash'
import { backupShareCard } from '@/app/(frontend)/layout'
import { Metadata } from 'next'
import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'
import { getMediaUrl } from '@/utils/media'

type MetadataOptions = {
  collection: CollectionSlug
  slug: string
  notFoundTitle?: string
  getTitle?: (record: any) => string
  getDescription?: (record: any) => string | Promise<string | undefined>
  getImages?: (record: any) => string[] | undefined
}

export async function generateMetadataForSlug({
  collection,
  slug,
  notFoundTitle = 'Not found',
  getTitle,
  getDescription,
  getImages,
}: MetadataOptions): Promise<Metadata> {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const result = await payload.find({
    collection,
    where: {
      slug: {
        equals: slug,
      },
      // Only fetch published content when not in draft mode
      // ...(!isDraftMode
      //   ? {
      //       _status: {
      //         equals: 'published',
      //       },
      //     }
      //   : {}),
    },
    depth: 1,
    draft: isDraftMode,
    limit: 1,
  })

  if (result.docs.length === 0) {
    return {
      title: notFoundTitle,
    }
  }

  const record = result.docs[0]

  // Get title
  let title: string
  if (getTitle) {
    title = getTitle(record)
  } else {
    // Default title extraction based on collection type
    switch (collection) {
      case 'blogPosts':
      case 'staticPages':
        title = (record as any).title || 'Untitled'
        break
      case 'organisingGroups':
        title = (record as any).fullName || (record as any).name || 'Untitled'
        break
      case 'campaigns':
      case 'companies':
      case 'categories':
      case 'countries':
      case 'actions':
        title = (record as any).name || 'Untitled'
        break
      default:
        title = 'Untitled'
    }
  }

  // Get description
  let description: string = ''
  if (getDescription) {
    const descriptionResult = getDescription(record)
    description =
      (descriptionResult instanceof Promise ? await descriptionResult : descriptionResult) || ''
    if (!description) {
      // Fallback to default if getDescription returns undefined
      description = 'Learn more about worker organising in the video game industry.'
    }
  } else {
    // Default description extraction
    const descriptionField = (record as any).description
    if (descriptionField) {
      description = lexicalToPlainText(descriptionField)
    }
    if (!description) {
      // Fallback descriptions based on collection type
      switch (collection) {
        case 'campaigns':
          description = 'Learn more about worker organising in the video game industry.'
          break
        case 'companies':
          description = `Learn about video game worker organising at ${title}.`
          break
        case 'categories':
          description = 'Learn more about worker organising in the video game industry.'
          break
        case 'organisingGroups':
          description = `${title} organise workers in the video game industry.`
          break
        case 'countries':
          description = `Learn about video game worker organising in ${title}.`
          break
        case 'blogPosts':
          description =
            (record as any).summary ||
            'Read more about worker organising in the video game industry.'
          break
        case 'staticPages':
          description =
            (record as any).summary ||
            'Learn more about worker organising in the video game industry.'
          break
        default:
          description = 'Learn more about worker organising in the video game industry.'
      }
    }
  }

  // Get images
  let images: OpenGraph['images']
  if (getImages) {
    images = getImages(record)
  } else {
    // Default image extraction
    const imageField =
      (record as any).featuredImage || (record as any).image || (record as any).logo
    if (imageField) {
      const media = imageField as Media
      const imageUrl = getMediaUrl(media)
      if (imageUrl) {
        images = [imageUrl]
      }
    }
  }

  if (!images || (Array.isArray(images) && images.length === 0)) {
    images = [backupShareCard]
  }

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
