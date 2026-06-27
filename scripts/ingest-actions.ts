/**
 * Migration script to pull data from Airtable and populate Payload CMS collections
 *
 * Run with: tsx scripts/ingest-actions.ts
 * Run only actions: tsx scripts/ingest-actions.ts --only-actions
 * Skip document uploads: tsx scripts/ingest-actions.ts --skip-docs
 * Only process unions: tsx scripts/ingest-actions.ts --only-unions
 */

import { airtableBase } from '../airtable'
import { getPayload } from 'payload'
import { slugify } from 'payload/shared'
import config from '../src/payload.config'
import env from 'env-var'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFile, unlink } from 'fs/promises'
import { BlogPost, Category, Company, Country, Action, OrganisingGroup } from '@/payload-types'
import { ActionInitiator } from '@/collections/enums'
import { htmlToLexical } from '@/utils/htmlToLexical'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { formatDate } from 'date-fns'

interface AirtableRecord {
  id: string
  fields: Record<string, any>
  createdTime?: string
}

interface MigrationStats {
  countries: { created: number; updated: number; skipped: number }
  companies: { created: number; updated: number; skipped: number }
  categories: { created: number; updated: number; skipped: number }
  organisingGroups: { created: number; updated: number; skipped: number }
  solidarityActions: { created: number; updated: number; skipped: number }
  blogPosts: { created: number; updated: number; skipped: number }
  staticPages: { created: number; updated: number; skipped: number }
}

const stats: MigrationStats = {
  countries: { created: 0, updated: 0, skipped: 0 },
  companies: { created: 0, updated: 0, skipped: 0 },
  categories: { created: 0, updated: 0, skipped: 0 },
  organisingGroups: { created: 0, updated: 0, skipped: 0 },
  solidarityActions: { created: 0, updated: 0, skipped: 0 },
  blogPosts: { created: 0, updated: 0, skipped: 0 },
  staticPages: { created: 0, updated: 0, skipped: 0 },
}

// Maps: Airtable ID -> Payload ID
const countryIdMap = new Map<string, string>()
const companyIdMap = new Map<string, string>()
const categoryIdMap = new Map<string, string>()
const organisingGroupIdMap = new Map<string, string>()
const solidarityActionIdMap = new Map<string, string>()
const blogPostIdMap = new Map<string, string>()

// Maps: Airtable attachment URL -> Payload Media ID (to avoid re-uploading)
const mediaUrlMap = new Map<string, string>()

/**
 * Load existing relationship maps from Payload when running in --only-actions mode
 * This allows us to resolve relationships without migrating all entities
 */
async function loadRelationshipMaps(payload: any) {
  console.log('  Loading countries...')
  const countries = await payload.find({
    collection: 'countries',
    limit: 1000,
  })
  for (const country of countries.docs) {
    if (country.airtableId) {
      countryIdMap.set(country.airtableId, country.id)
    }
  }

  console.log('  Loading companies...')
  const companies = await payload.find({
    collection: 'companies',
    limit: 1000,
  })
  for (const company of companies.docs) {
    if (company.airtableId) {
      companyIdMap.set(company.airtableId, company.id)
    }
  }

  console.log('  Loading categories...')
  const categories = await payload.find({
    collection: 'categories',
    limit: 1000,
  })
  for (const category of categories.docs) {
    if (category.airtableId) {
      categoryIdMap.set(category.airtableId, category.id)
    }
  }

  console.log('  Loading organising groups...')
  const organisingGroups = await payload.find({
    collection: 'organisingGroups',
    limit: 1000,
  })
  for (const group of organisingGroups.docs) {
    if (group.airtableId) {
      organisingGroupIdMap.set(group.airtableId, group.id)
    }
  }

  console.log(
    `  ✓ Loaded ${countryIdMap.size} countries, ${companyIdMap.size} companies, ${categoryIdMap.size} categories, ${organisingGroupIdMap.size} organising groups\n`,
  )
}

function parseDate(dateString: string | undefined): string | undefined {
  if (!dateString) return undefined
  // Try to parse the date string
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? undefined : date.toISOString()
}

/**
 * Extract year and month from an ISO date string in YYYY-MM format
 */
function getYearMonth(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`)
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Convert markdown to Lexical format
 */
async function markdownToLexical(markdown: string) {
  const payloadConfig = await config
  const lexicalContent = convertMarkdownToLexical({
    editorConfig: await editorConfigFactory.default({
      config: payloadConfig,
    }),
    markdown,
  })
  return lexicalContent
}

/**
 * Download file from URL and upload to Payload Media collection
 */
async function uploadFileToPayload(
  payload: any,
  attachmentUrl: string,
  filename: string,
  altText: string = filename,
  skipUpload: boolean = false,
): Promise<string | null> {
  try {
    // Check if we've already uploaded this file
    const existingMediaId = mediaUrlMap.get(attachmentUrl)
    if (existingMediaId) {
      console.log(`  ✓ File already uploaded: ${filename}`)
      return existingMediaId
    }

    // If the file exists in the media collection (search by filename) then add it to the map
    const existingMedia = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    })
    if (existingMedia.docs.length > 0) {
      mediaUrlMap.set(attachmentUrl, existingMedia.docs[0].id)
      console.log(`  ✓ File already uploaded: ${filename}`)
      return existingMedia.docs[0].id
    }

    // If skipUpload is true, don't download and upload new files
    if (skipUpload) {
      console.log(`  ⏭️  Skipping upload (--skip-docs): ${filename}`)
      return null
    }

    console.log(`  📥 Downloading: ${filename}`)

    // Download file
    const response = await fetch(attachmentUrl)
    if (!response.ok) {
      console.warn(`  ⚠️  Failed to download ${filename}: ${response.statusText}`)
      return null
    }

    const tempFilePath = join(tmpdir(), `airtable-${Date.now()}-${filename}`)

    // Save to temporary file
    const buffer = await response.arrayBuffer()
    await writeFile(tempFilePath, Buffer.from(buffer))

    console.log(`  📤 Uploading to Payload: ${filename}`)

    // Read the file
    const { readFile } = await import('fs/promises')
    const fileBuffer = await readFile(tempFilePath)

    // Create file object for Payload
    const file = {
      data: fileBuffer,
      name: filename,
      mimetype: response.headers.get('content-type') || 'application/octet-stream',
      size: fileBuffer.length,
    }

    // Upload to Payload
    const uploadResult = await payload.create({
      collection: 'media',
      data: {
        alt: altText,
        _status: 'published',
      },
      file: file as any,
    })

    // Clean up temp file
    await unlink(tempFilePath)

    const mediaId = uploadResult.id.toString()
    mediaUrlMap.set(attachmentUrl, mediaId)
    console.log(`  ✓ Uploaded successfully: ${filename}`)

    return mediaId
  } catch (error) {
    console.error(`  ✗ Error uploading ${filename}:`, error)
    return null
  }
}

/**
 * Process Airtable attachments and upload to Payload
 * Returns array of Payload media IDs
 */
async function processAttachments(
  payload: any,
  attachments: any[] | undefined,
  contextName: string = 'attachment',
  skipUpload: boolean = false,
): Promise<string[]> {
  if (!attachments || !Array.isArray(attachments)) {
    return []
  }

  const mediaIds: string[] = []

  for (const attachment of attachments) {
    const url = attachment.url
    const filename = attachment.filename
    const size = attachment.size

    if (!url || !filename) {
      console.warn(`  ⏭️  Skipping ${contextName}: missing URL or filename`)
      continue
    }

    // Skip if file is too large (e.g., > 10MB)
    if (size && size > 10 * 1024 * 1024) {
      console.warn(
        `  ⏭️  Skipping ${filename}: file too large (${Math.round(size / 1024 / 1024)}MB)`,
      )
      continue
    }

    const mediaId = await uploadFileToPayload(payload, url, filename, filename, skipUpload)
    if (mediaId) {
      mediaIds.push(mediaId)
    }
  }

  return mediaIds
}

async function migrateCountries(payload: any) {
  console.log('\n📂 Migrating Countries...')
  const base = airtableBase()
  const tableName = env.get('AIRTABLE_COUNTRIES_TABLE').default('Countries').asString()

  try {
    const records = await base(tableName).select().all()
    console.log(`Found ${records.length} countries`)

    for (const record of records) {
      const fields = record.fields as Record<string, any>

      const name = fields.Name.trim() || ''
      if (!name) {
        console.warn(`⏭️  Skipping country ${record.id}: missing name`)
        stats.countries.skipped++
        continue
      }

      // Sanitize slug from Airtable or generate from name
      const airtableSlug = fields.Slug || fields.slug
      const slug = (
        airtableSlug && airtableSlug.trim()
          ? slugify(airtableSlug.trim()) || slugify(name) || name.toLowerCase().replace(/\s+/g, '-')
          : slugify(name) || name.toLowerCase().replace(/\s+/g, '-')
      ) as string

      const countryData: Omit<Country, 'id' | 'updatedAt' | 'createdAt' | 'path' | 'url'> = {
        airtableId: record.id,
        name: name,
        isoA2: fields.countryCode || '',
        slug: slug,
        description: fields.Summary ? await markdownToLexical(fields.Summary) : undefined,
      }

      try {
        const existing = await payload.find({
          collection: 'countries',
          where: { airtableId: { equals: record.id } },
          limit: 1,
        })

        let result
        if (existing.docs.length > 0) {
          result = await payload.update({
            collection: 'countries',
            id: existing.docs[0].id,
            data: {
              ...countryData,
              _status: 'published',
            },
          })
          countryIdMap.set(record.id, result.id)
          stats.countries.updated++
          console.log(`✓ Updated country: ${countryData.name}`)
        } else {
          result = await payload.create({
            collection: 'countries',
            data: {
              ...countryData,
              _status: 'published',
            },
          })
          countryIdMap.set(record.id, result.id)
          stats.countries.created++
          console.log(`✓ Created country: ${countryData.name}`)
        }
      } catch (error) {
        console.error(`✗ Error upserting country ${slug}:`, error)
        console.error(JSON.stringify(countryData, null, 2))
        stats.countries.skipped++
      }
    }
  } catch (error) {
    console.error('Error fetching countries:', error)
  }
}

async function migrateCompanies(payload: any) {
  console.log('\n📂 Migrating Companies...')
  const base = airtableBase()
  const tableName = env.get('AIRTABLE_COMPANIES_TABLE').default('Companies').asString()

  try {
    const records = await base(tableName).select().all()
    console.log(`Found ${records.length} companies`)

    for (const record of records) {
      const fields = record.fields as Record<string, any>

      const name = fields.Name
      if (!name) {
        console.warn(`⏭️  Skipping company ${record.id}: missing name`)
        stats.companies.skipped++
        continue
      }

      // Sanitize slug from Airtable or generate from name
      const airtableSlug = record.fields.Slug as string | undefined
      const slugifiedAirtable = airtableSlug?.trim() ? slugify(airtableSlug.trim()) : null
      const slugifiedName = slugify(name.trim())
      const fallbackSlug = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      const slug = (slugifiedAirtable || slugifiedName || fallbackSlug) as string

      const companyData: Omit<Company, 'id' | 'updatedAt' | 'createdAt' | 'path' | 'url'> = {
        slug: slug,
        airtableId: record.id,
        name: name,
        description: fields.Summary ? await markdownToLexical(fields.Summary) : undefined,
      }

      try {
        const existing = await payload.find({
          collection: 'companies',
          where: { airtableId: { equals: record.id } },
          limit: 1,
        })

        let result
        if (existing.docs.length > 0) {
          result = await payload.update({
            collection: 'companies',
            id: existing.docs[0].id,
            data: {
              ...companyData,
              _status: 'published',
            },
          })
          companyIdMap.set(record.id, result.id)
          stats.companies.updated++
          console.log(`✓ Updated company: ${name}`)
        } else {
          result = await payload.create({
            collection: 'companies',
            data: {
              ...companyData,
              _status: 'published',
            },
          })
          companyIdMap.set(record.id, result.id)
          stats.companies.created++
          console.log(`✓ Created company: ${name}`)
        }
      } catch (error) {
        console.error(`✗ Error upserting company ${name}:`, error)
        console.error(JSON.stringify(companyData, null, 2))
        stats.companies.skipped++
      }
    }
  } catch (error) {
    console.error('Error fetching companies:', error)
  }
}

async function migrateCategories(payload: any) {
  console.log('\n📂 Migrating Categories...')
  const base = airtableBase()
  const tableName = env.get('AIRTABLE_CATEGORIES_TABLE').default('Categories').asString()

  try {
    const records = await base(tableName).select().all()
    console.log(`Found ${records.length} categories`)

    for (const record of records) {
      const fields = record.fields as Record<string, any>

      const name = fields.Name
      if (!name) {
        console.warn(`⏭️  Skipping category ${record.id}: missing name`)
        stats.categories.skipped++
        continue
      }

      // Sanitize slug from Airtable or generate from name
      const airtableSlug = record.fields.Slug as string | undefined
      const slug = (
        airtableSlug && airtableSlug.trim()
          ? slugify(airtableSlug.trim()) ||
            slugify(name.trim()) ||
            name.trim().toLowerCase().replace(/\s+/g, '-')
          : slugify(name.trim()) || name.trim().toLowerCase().replace(/\s+/g, '-')
      ) as string

      const categoryData: Omit<Category, 'id' | 'updatedAt' | 'createdAt' | 'path' | 'url'> = {
        slug: slug,
        airtableId: record.id,
        name: name,
        emoji: fields.Emoji || '',
        description: fields.Summary ? await markdownToLexical(fields.Summary) : undefined,
      }

      try {
        const existing = await payload.find({
          collection: 'categories',
          where: { airtableId: { equals: record.id } },
          limit: 1,
        })

        let result
        if (existing.docs.length > 0) {
          result = await payload.update({
            collection: 'categories',
            id: existing.docs[0].id,
            data: {
              ...categoryData,
              _status: 'published',
            },
          })
          categoryIdMap.set(record.id, result.id)
          stats.categories.updated++
          console.log(`✓ Updated category: ${name}`)
        } else {
          result = await payload.create({
            collection: 'categories',
            data: {
              ...categoryData,
              _status: 'published',
            },
          })
          categoryIdMap.set(record.id, result.id)
          stats.categories.created++
          console.log(`✓ Created category: ${name}`)
        }
      } catch (error) {
        console.error(`✗ Error upserting category ${name}:`, error)
        stats.categories.skipped++
      }
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

async function migrateOrganisingGroups(payload: any, onlyUnions: boolean = false) {
  console.log('\n📂 Migrating Organising Groups...')
  if (onlyUnions) {
    console.log('  Filtering to unions only (--only-unions flag set)')
  }
  const base = airtableBase()
  const tableName = env
    .get('AIRTABLE_ORGANISING_GROUPS_TABLE')
    .default('Organising Groups')
    .asString()

  try {
    const records = await base(tableName).select().all()
    console.log(`Found ${records.length} organising groups`)

    for (const record of records) {
      const fields = record.fields as Record<string, any>

      // Skip non-unions if --only-unions flag is set
      if (onlyUnions && !fields.IsUnion) {
        stats.organisingGroups.skipped++
        continue
      }

      const shortName = (fields.Name || '').trim()
      const fullName = (fields['Full Name'] || fields.FullName || '').trim()

      // if (!fullName) {
      //   console.warn(`⏭️  Skipping organising group ${record.id}: missing full name`)
      //   stats.organisingGroups.skipped++
      //   continue
      // }

      // Resolve country relationships using Airtable IDs
      const countryIds: string[] = []
      if (fields.Country && Array.isArray(fields.Country)) {
        for (const countryAirtableId of fields.Country) {
          const id = countryIdMap.get(countryAirtableId)
          if (id) countryIds.push(id)
        }
      }

      // Sanitize slug from Airtable or generate from name
      const allPossibleSlugs = [
        slugify(fields.slug),
        slugify(shortName),
        slugify(fullName),
        fullName.toLowerCase().replace(/\s+/g, '-'),
      ]
      const theSlug = allPossibleSlugs.find((slug) => !!slug)

      const organisingGroupData: Omit<
        OrganisingGroup,
        'id' | 'updatedAt' | 'createdAt' | 'path' | 'url'
      > = {
        airtableId: record.id,
        slug: theSlug,
        name: shortName || fullName,
        fullName: fullName || undefined,
        countries: countryIds.length > 0 ? countryIds : undefined,
        isUnion: fields.IsUnion || false,
        website: fields.Website || undefined,
        bluesky: fields.Bluesky || undefined,
        twitter: fields.Twitter || undefined,
      }

      try {
        const existing = await payload.find({
          collection: 'organisingGroups',
          where: { airtableId: { equals: record.id } },
          limit: 1,
        })

        let result
        if (existing.docs.length > 0) {
          result = await payload.update({
            collection: 'organisingGroups',
            id: existing.docs[0].id,
            data: {
              ...organisingGroupData,
              _status: 'published',
            },
          })
          organisingGroupIdMap.set(record.id, result.id)
          stats.organisingGroups.updated++
          console.log(`✓ Updated organising group: ${shortName}`)
        } else {
          result = await payload.create({
            collection: 'organisingGroups',
            data: {
              ...organisingGroupData,
              _status: 'published',
            },
          })
          organisingGroupIdMap.set(record.id, result.id)
          stats.organisingGroups.created++
          console.log(`✓ Created organising group: ${fullName}`)
        }
      } catch (error) {
        console.error(`✗ Error upserting organising group ${name}:`, error)
        stats.organisingGroups.skipped++
      }
    }
  } catch (error) {
    console.error('Error fetching organising groups:', error)
  }
}

async function migrateSolidarityActions(payload: any, skipDocs: boolean = false) {
  console.log('\n📂 Migrating Solidarity Actions from Airtable to Actions...')
  const base = airtableBase()
  const tableName = env
    .get('AIRTABLE_SOLIDARITY_ACTIONS_TABLE')
    .default('Solidarity Actions')
    .asString()

  try {
    const records = await base(tableName).select().all()
    console.log(`Found ${records.length} solidarity actions`)

    for (const record of records) {
      const fields = record.fields as Record<string, any>

      const name = fields.Name?.trim()
      const date = parseDate(fields.Date)

      if (!name || !date) {
        console.warn(`⏭️  Skipping solidarity action ${record.id}: missing required fields`)
        stats.solidarityActions.skipped++
        continue
      }

      // Resolve relationships
      const countryIds: string[] = []
      if (fields.Country && Array.isArray(fields.Country)) {
        for (const countryAirtableId of fields.Country) {
          const id = countryIdMap.get(countryAirtableId)
          if (id) countryIds.push(id)
        }
      }

      const companyIds: string[] = []
      if (fields.Company && Array.isArray(fields.Company)) {
        for (const companyAirtableId of fields.Company) {
          const id = companyIdMap.get(companyAirtableId)
          if (id) companyIds.push(id)
        }
      }

      const organisingGroupIds: string[] = []
      if (fields['Organising Groups'] && Array.isArray(fields['Organising Groups'])) {
        for (const groupAirtableId of fields['Organising Groups']) {
          const id = organisingGroupIdMap.get(groupAirtableId)
          if (id) organisingGroupIds.push(id)
        }
      }

      const categoryIds: string[] = []
      if (fields.Category && Array.isArray(fields.Category)) {
        for (const categoryAirtableId of fields.Category) {
          const id = categoryIdMap.get(categoryAirtableId)
          if (id) categoryIds.push(id)
        }
      }

      // Check if action already exists by airtableId
      let existingAction = null
      try {
        const existing = await payload.find({
          collection: 'actions',
          where: { airtableId: { equals: record.id } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          existingAction = existing.docs[0]
        }
      } catch (error) {
        // If lookup fails, continue anyway
      }

      // Sanitize slug from Airtable or generate from name and date
      const allPossibleSlugs = [
        slugify(fields.slug),
        // construct it from date and name like YYYY-MM-DD-name
        slugify(`${formatDate(new Date(date), 'yyyy-MM-dd')}-${name}`),
      ]
      const theSlug = allPossibleSlugs.find((slug) => !!slug)!

      // Process document attachments
      const documentIds = await processAttachments(
        payload,
        fields.Document,
        `documents for ${name}`,
        skipDocs,
      )

      // Create action data from solidarity action
      const actionData: Omit<Action, 'id' | 'updatedAt' | 'createdAt' | 'path' | 'url'> = {
        slug: theSlug,
        airtableId: record.id,
        name: name,
        date: date,
        location: fields.Location || undefined,
        description: fields.Summary ? await markdownToLexical(fields.Summary) : undefined,
        link: fields.Link || undefined,
        documents: documentIds.length > 0 ? documentIds : undefined,
        countries: countryIds.length > 0 ? countryIds : undefined,
        companies: companyIds.length > 0 ? companyIds : undefined,
        organisingGroups: organisingGroupIds.length > 0 ? organisingGroupIds : undefined,
        categories: categoryIds.length > 0 ? categoryIds : undefined,
        initiator: ActionInitiator.WORKER_LED,
      }

      try {
        let result
        if (existingAction) {
          // Update existing action
          result = await payload.update({
            collection: 'actions',
            id: existingAction.id,
            data: {
              ...actionData,
              _status: 'published',
            },
          })
          solidarityActionIdMap.set(record.id, result.id)
          stats.solidarityActions.updated++
          console.log(`✓ Updated action from solidarity action: ${name}`)
        } else {
          // Create new action
          result = await payload.create({
            collection: 'actions',
            data: {
              ...actionData,
              _status: 'published',
            },
          })
          solidarityActionIdMap.set(record.id, result.id)
          stats.solidarityActions.created++
          console.log(`✓ Created action from solidarity action: ${name}`)
        }
      } catch (error) {
        console.error(`✗ Error upserting action from solidarity action ${name}:`, error)
        stats.solidarityActions.skipped++
      }
    }
  } catch (error) {
    console.error('Error fetching solidarity actions:', error)
  }
}

async function migrateBlogPosts(payload: any) {
  console.log('\n📂 Migrating Blog Posts...')
  const base = airtableBase()
  const tableName = env.get('AIRTABLE_BLOG_POSTS_TABLE').default('Blog Posts').asString()

  try {
    const records = await base(tableName).select().all()
    console.log(`Found ${records.length} blog posts`)

    for (const record of records) {
      const fields = record.fields as Record<string, any>

      const title = fields.Title.trim()

      if (!title || !fields.Date) {
        console.warn(`⏭️  Skipping blog post ${record.id}: missing required fields`)
        stats.blogPosts.skipped++
        continue
      }

      // Sanitize slug from Airtable or generate from title
      const airtableSlug = fields.Slug as string | undefined
      const slug = (
        airtableSlug && airtableSlug.trim()
          ? slugify(airtableSlug.trim()) ||
            slugify(title) ||
            title.toLowerCase().replace(/\s+/g, '-')
          : slugify(title) || title.toLowerCase().replace(/\s+/g, '-')
      ) as string

      // Process image attachments
      const imageIds = await processAttachments(payload, fields.Image, `image for ${title}`)
      const imageId = imageIds.length > 0 ? imageIds[0] : undefined

      const blogPostData: Omit<BlogPost, 'id' | 'updatedAt' | 'createdAt' | 'path' | 'url'> = {
        airtableId: record.id,
        slug: slug,
        byline: fields.ByLine || undefined,
        title: title,
        image: imageId,
        body: await htmlToLexical(fields.Body),
        date: parseDate(fields.Date)!,
      }

      try {
        const existing = await payload.find({
          collection: 'blogPosts',
          where: { airtableId: { equals: record.id } },
          limit: 1,
        })

        let result
        if (existing.docs.length > 0) {
          result = await payload.update({
            collection: 'blogPosts',
            id: existing.docs[0].id,
            data: {
              ...blogPostData,
              _status: 'published',
            },
          })
          blogPostIdMap.set(record.id, result.id)
          stats.blogPosts.updated++
          console.log(`✓ Updated blog post: ${title}`)
        } else {
          result = await payload.create({
            collection: 'blogPosts',
            data: {
              ...blogPostData,
              _status: 'published',
            },
          })
          blogPostIdMap.set(record.id, result.id)
          stats.blogPosts.created++
          console.log(`✓ Created blog post: ${title}`)
        }
      } catch (error) {
        console.error(`✗ Error upserting blog post ${title}:`, error)
        stats.blogPosts.skipped++
      }
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error)
  }
}

async function main() {
  // Parse command-line arguments
  const args = process.argv.slice(2)
  const onlyActions = args.includes('--only-actions')
  const skipDocs = args.includes('--skip-docs')
  const onlyUnions = args.includes('--only-unions')

  if (onlyActions) {
    console.log('🚀 Starting Airtable to Payload CMS migration (Actions only)...\n')
  } else {
    console.log('🚀 Starting Airtable to Payload CMS migration...\n')
  }

  if (skipDocs) {
    console.log('⚠️  Document uploads will be skipped (--skip-docs flag set)\n')
  }

  if (onlyUnions) {
    console.log('⚠️  Only unions will be processed (--only-unions flag set)\n')
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    if (onlyUnions) {
      // Only migrate organising groups (unions)
      await migrateOrganisingGroups(payload, onlyUnions)
    } else if (onlyActions) {
      // Only migrate actions (but still need to load relationship maps first)
      // Load existing relationships from Payload to resolve IDs
      console.log('📋 Loading existing relationships...')
      await loadRelationshipMaps(payload)
      await migrateSolidarityActions(payload, skipDocs)
    } else {
      // Migrate in order: independent entities first, then relationships
      await migrateCountries(payload)
      await migrateCompanies(payload)
      await migrateCategories(payload)
      await migrateOrganisingGroups(payload, onlyUnions)
      await migrateSolidarityActions(payload, skipDocs)
      await migrateBlogPosts(payload)
    }

    // Print summary
    console.log('\n📊 Migration Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (onlyUnions) {
      console.log(
        `Organising Groups: ${stats.organisingGroups.created} created, ${stats.organisingGroups.updated} updated, ${stats.organisingGroups.skipped} skipped`,
      )
    } else if (!onlyActions) {
      console.log(
        `Countries:     ${stats.countries.created} created, ${stats.countries.updated} updated, ${stats.countries.skipped} skipped`,
      )
      console.log(
        `Companies:     ${stats.companies.created} created, ${stats.companies.updated} updated, ${stats.companies.skipped} skipped`,
      )
      console.log(
        `Categories:    ${stats.categories.created} created, ${stats.categories.updated} updated, ${stats.categories.skipped} skipped`,
      )
      console.log(
        `Organising Groups: ${stats.organisingGroups.created} created, ${stats.organisingGroups.updated} updated, ${stats.organisingGroups.skipped} skipped`,
      )
    }

    if (!onlyUnions) {
      console.log(
        `Solidarity Actions: ${stats.solidarityActions.created} created, ${stats.solidarityActions.updated} updated, ${stats.solidarityActions.skipped} skipped`,
      )
    }

    if (!onlyActions && !onlyUnions) {
      console.log(
        `Blog Posts:    ${stats.blogPosts.created} created, ${stats.blogPosts.updated} updated, ${stats.blogPosts.skipped} skipped`,
      )
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (onlyUnions) {
      console.log(
        `\n✅ Organising Groups: ${stats.organisingGroups.created} created, ${stats.organisingGroups.updated} updated!`,
      )
    } else if (onlyActions) {
      console.log(
        `\n✅ Actions: ${stats.solidarityActions.created} created, ${stats.solidarityActions.updated} updated!`,
      )
    } else {
      const totalCreated =
        stats.countries.created +
        stats.companies.created +
        stats.categories.created +
        stats.organisingGroups.created +
        stats.solidarityActions.created +
        stats.blogPosts.created

      const totalUpdated =
        stats.countries.updated +
        stats.companies.updated +
        stats.categories.updated +
        stats.organisingGroups.updated +
        stats.solidarityActions.updated +
        stats.blogPosts.updated

      console.log(`\n✅ Total: ${totalCreated} records created, ${totalUpdated} records updated!`)
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

main()
