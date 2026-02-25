import { unstable_cache } from 'next/cache'

// Re-export for on-demand revalidation (e.g. in Server Actions or Route Handlers after Payload content changes).
// Use revalidateTag(tag, 'max') for stale-while-revalidate: serve stale, revalidate in background.
export { revalidateTag } from 'next/cache'

/**
 * Cache tags for on-demand revalidation.
 * Prefer using CACHE_KEYS and getCacheConfig() so tags stay in sync with revalidation.
 */
export const CACHE_TAGS = {
  homepage: 'homepage',
  actions: 'actions',
  categories: 'categories',
  companies: 'companies',
  organisingGroups: 'organisingGroups',
  campaigns: 'campaigns',
  countries: 'countries',
  countriesIndex: 'countries-index',
  companiesIndex: 'companies-index',
  campaignsIndex: 'campaigns-index',
} as const

/** Time-based revalidate in seconds (stale after this, revalidate in background when using revalidateTag with 'max'). */
export const CACHE_REVALIDATE_SECONDS = 12 * 60 * 60 // 12 hours

/** Cache key identifiers. Add new keys here when adding a cached page. */
export const CACHE_KEYS = {
  HOMEPAGE: 'homepage',
  CAMPAIGNS_INDEX: 'campaigns-index',
  COMPANIES_INDEX: 'companies-index',
  COUNTRIES_INDEX: 'countries-index',
} as const

export type CacheKey = (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS]

/**
 * Single source of truth: each cache key has keyParts (for unstable_cache) and tags.
 * Revalidation (hooks, API) uses this so tags are never duplicated.
 */
const CACHE_ENTRIES: Record<CacheKey, { keyParts: string[]; tags: readonly string[] }> = {
  [CACHE_KEYS.HOMEPAGE]: {
    keyParts: ['homepage'],
    tags: [
      CACHE_TAGS.homepage,
      CACHE_TAGS.actions,
      CACHE_TAGS.categories,
      CACHE_TAGS.companies,
      CACHE_TAGS.organisingGroups,
      CACHE_TAGS.campaigns,
      CACHE_TAGS.countries,
    ],
  },
  [CACHE_KEYS.CAMPAIGNS_INDEX]: {
    keyParts: ['campaigns-index'],
    tags: [CACHE_TAGS.campaignsIndex, CACHE_TAGS.campaigns],
  },
  [CACHE_KEYS.COMPANIES_INDEX]: {
    keyParts: ['companies-index'],
    tags: [CACHE_TAGS.companiesIndex, CACHE_TAGS.companies, CACHE_TAGS.actions],
  },
  [CACHE_KEYS.COUNTRIES_INDEX]: {
    keyParts: ['countries-index'],
    tags: [CACHE_TAGS.countriesIndex, CACHE_TAGS.countries, CACHE_TAGS.actions],
  },
}

/**
 * Which cache keys to invalidate when a collection changes.
 * Add new collections here when they affect a cached page.
 */
export const COLLECTION_AFFECTS_KEYS: Record<string, CacheKey[]> = {
  actions: [
    CACHE_KEYS.HOMEPAGE,
    CACHE_KEYS.COUNTRIES_INDEX,
    CACHE_KEYS.COMPANIES_INDEX,
    CACHE_KEYS.CAMPAIGNS_INDEX,
  ],
  countries: [CACHE_KEYS.HOMEPAGE, CACHE_KEYS.COUNTRIES_INDEX],
  companies: [CACHE_KEYS.HOMEPAGE, CACHE_KEYS.COMPANIES_INDEX],
  categories: [CACHE_KEYS.HOMEPAGE],
  organisingGroups: [CACHE_KEYS.HOMEPAGE],
  campaigns: [CACHE_KEYS.HOMEPAGE, CACHE_KEYS.CAMPAIGNS_INDEX],
}

/**
 * Which cache keys to invalidate when a global changes.
 */
export const GLOBAL_AFFECTS_KEYS: Record<string, CacheKey[]> = {
  campaignsPage: [CACHE_KEYS.CAMPAIGNS_INDEX],
}

/** Tag for collection-scoped caches (slug pages, metadata). Used by generateMetadata + getCachedDataForSlug. */
export function getTagForCollection(collectionSlug: string): string {
  return (CACHE_TAGS as Record<string, string>)[collectionSlug] ?? collectionSlug
}

/** Tags for global metadata caches. Revalidate when that global changes. Included in getAllCacheTags. */
export const METADATA_GLOBAL_TAGS: Record<string, string> = {
  campaignsPage: CACHE_TAGS.campaignsIndex,
  aboutPage: 'metadata-global-aboutPage',
  dataPage: 'metadata-global-dataPage',
  startOrganising: 'metadata-global-startOrganising',
  actionSubmissionPage: 'metadata-global-actionSubmissionPage',
}

export function getCacheConfig(key: CacheKey) {
  const entry = CACHE_ENTRIES[key]
  if (!entry) throw new Error(`Unknown cache key: ${key}`)
  return entry
}

/** All tags used by any cache entry. Use for "bust all" / revalidate API. */
export function getAllCacheTags(): string[] {
  const set = new Set<string>()
  for (const key of Object.keys(CACHE_ENTRIES) as CacheKey[]) {
    for (const t of getCacheConfig(key).tags) set.add(t)
  }
  for (const t of Object.values(METADATA_GLOBAL_TAGS)) set.add(t)
  return [...set]
}

/**
 * Wrap an async function with unstable_cache. Use for global, non-per-user data.
 * Prefer getCachedData() in payload.server.ts so editor vs public and tags are handled in one place.
 */
export function cacheWithTags<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  tags: string[],
): Promise<T> {
  return unstable_cache(fn, keyParts, {
    tags: [...tags],
    revalidate: CACHE_REVALIDATE_SECONDS,
  })()
}
