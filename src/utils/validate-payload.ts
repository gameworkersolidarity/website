import { z } from 'zod'
import type {
  User,
  Media,
  StaticPage,
  BlogPost,
  Country,
  Company,
  Category,
  OrganisingGroup,
  Campaign,
  Action,
} from '@/payload-types'
import {
  ActionSchema,
  CampaignSchema,
  CategorySchema,
  CompanySchema,
  CountrySchema,
  OrganisingGroupSchema,
  MediaSchema,
  BlogPostSchema,
  StaticPageSchema,
  UserSchema,
} from '@/payload-zod-schemas'

// Map collection names to their Zod schemas
const collectionSchemas = {
  actions: ActionSchema,
  campaigns: CampaignSchema,
  categories: CategorySchema,
  companies: CompanySchema,
  countries: CountrySchema,
  organisingGroups: OrganisingGroupSchema,
  media: MediaSchema,
  blogPosts: BlogPostSchema,
  staticPages: StaticPageSchema,
  users: UserSchema,
} as const

type CollectionName = keyof typeof collectionSchemas

// Type mapping from collection names to TypeScript types
type CollectionTypeMap = {
  actions: Action
  campaigns: Campaign
  categories: Category
  companies: Company
  countries: Country
  organisingGroups: OrganisingGroup
  media: Media
  blogPosts: BlogPost
  staticPages: StaticPage
  users: User
}

type CollectionType<T extends CollectionName> = CollectionTypeMap[T]

/**
 * Validates a single document from a Payload query result
 */
export function validatePayloadDocument<T extends CollectionName>(
  collection: T,
  document: unknown,
): CollectionType<T> {
  const schema = collectionSchemas[collection]
  if (!schema) {
    throw new Error(`No Zod schema found for collection: ${collection}`)
  }

  const result = schema.safeParse(document)
  if (!result.success) {
    console.error(`Validation failed for ${collection}:`, {
      errors: result.error.issues,
      document: JSON.stringify(document, null, 2).substring(0, 500),
    })
    throw new Error(
      `Invalid ${collection} document: ${result.error.issues.map((i) => i.message).join(', ')}`,
    )
  }

  return result.data as CollectionType<T>
}

/**
 * Validates an array of documents from a Payload query result
 */
export function validatePayloadDocuments<T extends CollectionName>(
  collection: T,
  documents: unknown[],
): CollectionType<T>[] {
  return documents.map((doc) => validatePayloadDocument(collection, doc))
}

/**
 * Validates a Payload query result (with docs array)
 * @param strict - If false, skips validation for queries with select fields (since partial validation doesn't work with lazy schemas)
 */
export function validatePayloadResult<T extends CollectionName>(
  collection: T,
  result: { docs: unknown[]; [key: string]: unknown },
  strict = true,
): {
  docs: CollectionType<T>[]
  [key: string]: unknown
} {
  const schema = collectionSchemas[collection]
  if (!schema) {
    throw new Error(`No Zod schema found for collection: ${collection}`)
  }

  // For non-strict mode (partial queries), skip validation since lazy schemas don't support .partial()
  // The data structure is intentionally partial, so validation would fail anyway
  if (!strict) {
    return {
      ...result,
      docs: result.docs as CollectionType<T>[],
    }
  }

  const validatedDocs = result.docs.map((doc) => {
    const parseResult = schema.safeParse(doc)
    if (!parseResult.success) {
      console.error(`Validation failed for ${collection}:`, {
        errors: parseResult.error.issues,
        document: JSON.stringify(doc, null, 2).substring(0, 500),
      })
      throw new Error(
        `Invalid ${collection} document: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
      )
    }
    return parseResult.data as CollectionType<T>
  })

  return {
    ...result,
    docs: validatedDocs,
  }
}
