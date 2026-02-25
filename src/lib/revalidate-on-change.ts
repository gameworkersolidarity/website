import { revalidateTag } from '@/lib/cache'
import {
  COLLECTION_AFFECTS_KEYS,
  GLOBAL_AFFECTS_KEYS,
  getCacheConfig,
  METADATA_GLOBAL_TAGS,
} from '@/lib/cache'

/**
 * Revalidate Next.js cache tags for a collection. Call from Payload afterChange/afterDelete hooks.
 * Uses the cache registry so tags stay in sync with cached pages. Profile 'max' = stale-while-revalidate.
 */
export function revalidateTagsForCollection(collectionSlug: string): void {
  const keys = COLLECTION_AFFECTS_KEYS[collectionSlug]
  if (!keys) return
  for (const key of keys) {
    const { tags } = getCacheConfig(key)
    for (const tag of tags) {
      revalidateTag(tag, 'max')
    }
  }
}

/**
 * Revalidate cache tags for a global. Call from Payload global afterChange hooks.
 * Also revalidates the global's metadata cache tag when present.
 */
export function revalidateTagsForGlobal(globalSlug: string): void {
  const keys = GLOBAL_AFFECTS_KEYS[globalSlug]
  if (keys) {
    for (const key of keys) {
      const { tags } = getCacheConfig(key)
      for (const tag of tags) {
        revalidateTag(tag, 'max')
      }
    }
  }
  const metadataTag = METADATA_GLOBAL_TAGS[globalSlug]
  if (metadataTag) {
    revalidateTag(metadataTag, 'max')
  }
}

/** Payload afterChange/afterDelete hook that revalidates cache for the given collection. */
export function revalidateCacheHook(collectionSlug: string) {
  return () => {
    revalidateTagsForCollection(collectionSlug)
  }
}

/** Payload global afterChange hook that revalidates cache for the given global. */
export function revalidateCacheHookForGlobal(globalSlug: string) {
  return () => {
    revalidateTagsForGlobal(globalSlug)
  }
}
