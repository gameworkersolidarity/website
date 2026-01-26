import type { Media } from '@/payload-types'
import { projectStrings } from '@/project-strings'
import env from 'env-var'

type MediaUrlOptions = {
  baseUrl?: string
}

const isRelativeUrl = (url: string) => url.startsWith('/')

export const getMediaUrl = (media?: Media | null, options: MediaUrlOptions = {}): string | null => {
  if (!media) {
    return null
  }

  const cloudinaryUrl = media.cloudinary?.secure_url || null
  const localUrl = media.url || null
  const prefersCloudinary = projectStrings.STORAGE_TYPE === 'cloudinary'

  const selectedUrl = prefersCloudinary ? cloudinaryUrl || localUrl : localUrl || cloudinaryUrl

  if (!selectedUrl) {
    return null
  }

  if (options.baseUrl && isRelativeUrl(selectedUrl)) {
    return `${options.baseUrl}${selectedUrl}`
  }

  return selectedUrl
}

export const getThumbnailUrl = (media?: Media | null): string | null => {
  if (!media) {
    return null
  }

  // For PDFs, use Cloudinary's thumbnail_url if available, or generate one
  if (media.mimeType === 'application/pdf' || media.cloudinary?.format === 'pdf') {
    // Use the thumbnail_url from Cloudinary if available
    if (media.cloudinary?.thumbnail_url) {
      return media.cloudinary.thumbnail_url
    }
    // Otherwise, generate a thumbnail URL using Cloudinary's PDF thumbnail feature
    if (media.cloudinary?.public_id && projectStrings.STORAGE_TYPE === 'cloudinary') {
      const cloudName =
        env.get('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME').asString() ||
        env.get('CLOUDINARY_NAME').asString()
      if (cloudName) {
        const page = media.cloudinary.selected_page || 1
        return `https://res.cloudinary.com/${cloudName}/image/upload/pg_${page},f_jpg,q_auto/${media.cloudinary.public_id}.pdf`
      }
    }
    return getMediaUrl(media) || ''
  }

  return media.thumbnailURL || getMediaUrl(media) || ''
}
