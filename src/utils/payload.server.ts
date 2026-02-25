'use server'

import config from '@payload-config'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { loadDraftMode } from './auth'
import {
  type CacheKey,
  getCacheConfig,
  cacheWithTags,
  CACHE_TAGS,
  METADATA_GLOBAL_TAGS,
  isSlugPageCachingEnabled,
} from '@/lib/cache'

export const payloadUserQuery: Payload['find'] = async (options) => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { draftModeStatus, authStatus } = await loadDraftMode(payload)

  return payload.find({
    ...options,
    draft: draftModeStatus.isEnabled,
    user: authStatus.user,
    overrideAccess: false,
  } as typeof options)
}

/**
 * Public-only find: no headers(), no draft mode. Safe to use inside unstable_cache.
 * Use for cached pages when the user is not logged in.
 */
export const payloadPublicQuery: Payload['find'] = async (options) => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  return payload.find({
    ...options,
    draft: false,
    user: undefined,
    overrideAccess: false,
  } as typeof options)
}

export const payloadUserGlobalQuery: Payload['findGlobal'] = async (options) => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { draftModeStatus, authStatus } = await loadDraftMode(payload)

  return payload.findGlobal({
    ...options,
    draft: draftModeStatus.isEnabled,
    user: authStatus.user,
    overrideAccess: false,
  } as typeof options)
}

/**
 * Public-only findGlobal: no draft, no user. Safe to use inside unstable_cache.
 */
export const payloadPublicGlobalQuery: Payload['findGlobal'] = async (options) => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  return payload.findGlobal({
    ...options,
    draft: false,
    user: undefined,
    overrideAccess: false,
  } as typeof options)
}

export type PayloadQueryContext = {
  query: Payload['find']
  globalQuery: Payload['findGlobal']
}

/**
 * Run a fetcher with editor-aware caching: editors get live (and draft) data;
 * others get cached public data. Tags and revalidation come from the cache registry.
 * Use this for all cached index/homepage pages so behaviour and invalidation stay in sync.
 */
export async function getCachedData<T>(
  key: CacheKey,
  fetcher: (ctx: PayloadQueryContext) => Promise<T>,
): Promise<T> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { authStatus } = await loadDraftMode(payload)
  const isEditor = !!authStatus.user

  if (isEditor) {
    return fetcher({
      query: payloadUserQuery,
      globalQuery: payloadUserGlobalQuery,
    })
  }

  const { keyParts, tags } = getCacheConfig(key)
  return cacheWithTags(
    () =>
      fetcher({
        query: payloadPublicQuery,
        globalQuery: payloadPublicGlobalQuery,
      }),
    keyParts,
    [...tags],
  )
}

/** Collection slugs that have a corresponding cache tag for slug-page revalidation. */
const COLLECTION_SLUG_TO_TAG: Record<string, string> = {
  actions: CACHE_TAGS.actions,
  categories: CACHE_TAGS.categories,
  companies: CACHE_TAGS.companies,
  countries: CACHE_TAGS.countries,
  organisingGroups: CACHE_TAGS.organisingGroups,
  campaigns: CACHE_TAGS.campaigns,
}

/**
 * Editor-aware caching for collection slug (detail) pages. Editors get live/draft data;
 * others get cached public data. Uses the collection's tag so revalidateTagsForCollection
 * invalidates these when the collection changes.
 */
export async function getCachedDataForSlug<T>(
  collectionSlug: string,
  slug: string,
  fetcher: (ctx: PayloadQueryContext) => Promise<T>,
): Promise<T> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { authStatus } = await loadDraftMode(payload)
  const isEditor = !!authStatus.user

  if (isEditor) {
    return fetcher({
      query: payloadUserQuery,
      globalQuery: payloadUserGlobalQuery,
    })
  }

  if (!isSlugPageCachingEnabled()) {
    return fetcher({
      query: payloadPublicQuery,
      globalQuery: payloadPublicGlobalQuery,
    })
  }

  const tag = COLLECTION_SLUG_TO_TAG[collectionSlug] ?? collectionSlug
  return cacheWithTags(
    () =>
      fetcher({
        query: payloadPublicQuery,
        globalQuery: payloadPublicGlobalQuery,
      }),
    [collectionSlug, slug],
    [tag],
  )
}

/**
 * Cached public global fetch for generateMetadata. Use in global-based metadata only.
 * Revalidation uses METADATA_GLOBAL_TAGS so globals can invalidate their metadata cache.
 * Default return is a permissive record so description/title etc. work without extra typing.
 */
export async function getCachedGlobalForMetadata<T = Record<string, unknown>>(
  globalSlug: string,
): Promise<T | null> {
  const tag = METADATA_GLOBAL_TAGS[globalSlug] ?? globalSlug
  const data = await cacheWithTags(
    () =>
      payloadPublicGlobalQuery({
        slug: globalSlug,
      } as Parameters<Payload['findGlobal']>[0]),
    ['metadata', 'global', globalSlug],
    [tag],
  )
  // Cast to T so default Record<string, unknown> allows any property access at call sites
  return data as T | null
}
