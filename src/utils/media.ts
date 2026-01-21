import type { Media } from '@/payload-types'
import { projectStrings } from '@/project-strings'

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
