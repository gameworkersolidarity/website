import { CollectionSlug } from 'payload'
import { payloadUserQuery } from '@/utils/payload.server'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { Media } from '@/payload-types'
import { backupShareCard } from '@/utils/shareCard'
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
  const result = await payloadUserQuery({
    collection,
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 1,
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
        images = [
          {
            url: imageUrl,
            width: media.width || 1200,
            height: media.height || 630,
            alt: media.alt || 'Game Workers Solidarity Platform',
          },
        ]
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
