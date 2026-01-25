/**
 * Migration script to pull data from Airtable and populate Payload CMS collections
 *
 * Run with: tsx scripts/ingest-actions.ts
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

interface AirtableRecord {
  id: string
  fields: Record<string, any>
  createdTime?: string
}

interface MigrationStats {
  countries: { created: number; skipped: number }
  companies: { created: number; skipped: number }
  categories: { created: number; skipped: number }
  organisingGroups: { created: number; skipped: number }
  solidarityActions: { created: number; skipped: number }
  blogPosts: { created: number; skipped: number }
  staticPages: { created: number; skipped: number }
}

const stats: MigrationStats = {
  countries: { created: 0, skipped: 0 },
  companies: { created: 0, skipped: 0 },
  categories: { created: 0, skipped: 0 },
  organisingGroups: { created: 0, skipped: 0 },
  solidarityActions: { created: 0, skipped: 0 },
  blogPosts: { created: 0, skipped: 0 },
  staticPages: { created: 0, skipped: 0 },
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

function parseDate(dateString: string | undefined): string | undefined {
  if (!dateString) return undefined
  // Try to parse the date string
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? undefined : date.toISOString()
}

/**
 * Download file from URL and upload to Payload Media collection
 */
async function uploadFileToPayload(
  payload: any,
  attachmentUrl: string,
  filename: string,
  altText: string = filename,
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

    const mediaId = await uploadFileToPayload(payload, url, filename)
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
        description: fields.Summary ? await htmlToLexical(fields.Summary) : undefined,
      }

      try {
        const existing = await payload.find({
          collection: 'countries',
          where: { airtableId: { equals: record.id } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          console.log(`✓ Country "${slug}" already exists, skipping`)
          stats.countries.skipped++
          countryIdMap.set(record.id, existing.docs[0].id)
          continue
        }

        const result = await payload.create({
          collection: 'countries',
          data: {
            ...countryData,
            _status: 'published',
          },
        })

        countryIdMap.set(record.id, result.id)
        stats.countries.created++
        console.log(`✓ Created country: ${countryData.name}`)
      } catch (error) {
        console.error(`✗ Error creating country ${slug}:`, error)
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
        description: fields.Summary ? await htmlToLexical(fields.Summary) : undefined,
      }

      try {
        const existing = await payload.find({
          collection: 'companies',
          where: { airtableId: { equals: record.id } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          console.log(`✓ Company "${name}" already exists, skipping`)
          stats.companies.skipped++
          companyIdMap.set(record.id, existing.docs[0].id)
          continue
        }

        const result = await payload.create({
          collection: 'companies',
          data: {
            ...companyData,
            _status: 'published',
          },
        })

        companyIdMap.set(record.id, result.id)
        stats.companies.created++
        console.log(`✓ Created company: ${name}`)
      } catch (error) {
        console.error(`✗ Error creating company ${name}:`, error)
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
        description: fields.Summary ? await htmlToLexical(fields.Summary) : undefined,
      }

      try {
        const existing = await payload.find({
          collection: 'categories',
          where: { airtableId: { equals: record.id } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          console.log(`✓ Category "${name}" already exists, skipping`)
          stats.categories.skipped++
          categoryIdMap.set(record.id, existing.docs[0].id)
          continue
        }

        const result = await payload.create({
          collection: 'categories',
          data: {
            ...categoryData,
            _status: 'published',
          },
        })

        categoryIdMap.set(record.id, result.id)
        stats.categories.created++
        console.log(`✓ Created category: ${name}`)
      } catch (error) {
        console.error(`✗ Error creating category ${name}:`, error)
        stats.categories.skipped++
      }
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

async function migrateOrganisingGroups(payload: any) {
  console.log('\n📂 Migrating Organising Groups...')
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

      const name = fields.Name.trim()
      const slug = fields.slug

      if (!name) {
        console.warn(`⏭️  Skipping organising group ${record.id}: missing name`)
        stats.organisingGroups.skipped++
        continue
      }

      // Resolve country relationships using Airtable IDs
      const countryIds: string[] = []
      if (fields.Country && Array.isArray(fields.Country)) {
        for (const countryAirtableId of fields.Country) {
          const id = countryIdMap.get(countryAirtableId)
          if (id) countryIds.push(id)
        }
      }

      // Sanitize slug from Airtable or generate from name
      const airtableSlug = fields.slug as string | undefined
      const sanitizedSlug = (
        airtableSlug && airtableSlug.trim()
          ? slugify(airtableSlug.trim()) || slugify(name) || name.toLowerCase().replace(/\s+/g, '-')
          : slugify(name) || name.toLowerCase().replace(/\s+/g, '-')
      ) as string

      const organisingGroupData: Omit<
        OrganisingGroup,
        'id' | 'updatedAt' | 'createdAt' | 'path' | 'url'
      > = {
        airtableId: record.id,
        slug: sanitizedSlug,
        name: name,
        fullName: fields['Full Name'] || fields.FullName || undefined,
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

        if (existing.docs.length > 0) {
          console.log(`✓ Organising group "${name}" already exists, skipping`)
          stats.organisingGroups.skipped++
          organisingGroupIdMap.set(record.id, existing.docs[0].id)
          continue
        }

        const result = await payload.create({
          collection: 'organisingGroups',
          data: {
            ...organisingGroupData,
            _status: 'published',
          },
        })

        organisingGroupIdMap.set(record.id, result.id)
        stats.organisingGroups.created++
        console.log(`✓ Created organising group: ${name}`)
      } catch (error) {
        console.error(`✗ Error creating organising group ${name}:`, error)
        stats.organisingGroups.skipped++
      }
    }
  } catch (error) {
    console.error('Error fetching organising groups:', error)
  }
}

async function migrateSolidarityActions(payload: any) {
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
      try {
        const existing = await payload.find({
          collection: 'actions',
          where: { airtableId: { equals: record.id } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          console.log(`✓ Action "${name}" already exists, skipping`)
          stats.solidarityActions.skipped++
          solidarityActionIdMap.set(record.id, existing.docs[0].id)
          continue
        }
      } catch (error) {
        // If lookup fails, continue anyway
      }

      // Sanitize slug from Airtable or generate from name and date
      const airtableSlug = record.fields.Slug as string | undefined
      const dateSlug = slugify(date) || date.split('T')[0]
      const nameSlug = slugify(name) || name.toLowerCase().replace(/\s+/g, '-')
      const slug = (
        airtableSlug && airtableSlug.trim()
          ? slugify(airtableSlug.trim()) || `${dateSlug}-${nameSlug}`
          : `${dateSlug}-${nameSlug}`
      ) as string

      // Create action data from solidarity action
      const actionData: Omit<Action, 'id' | 'updatedAt' | 'createdAt' | 'path' | 'url'> = {
        slug: slug,
        airtableId: record.id,
        name: name,
        date: date,
        location: fields.Location || undefined,
        description: fields.Summary ? await htmlToLexical(fields.Summary) : undefined,
        countries: countryIds.length > 0 ? countryIds : undefined,
        companies: companyIds.length > 0 ? companyIds : undefined,
        organisingGroups: organisingGroupIds.length > 0 ? organisingGroupIds : undefined,
        categories: categoryIds.length > 0 ? categoryIds : undefined,
        initiator: ActionInitiator.WORKER_LED,
      }

      try {
        const result = await payload.create({
          collection: 'actions',
          data: {
            ...actionData,
            _status: 'published',
          },
        })

        solidarityActionIdMap.set(record.id, result.id)
        stats.solidarityActions.created++
        console.log(`✓ Created action from solidarity action: ${name}`)
      } catch (error) {
        console.error(`✗ Error creating action from solidarity action ${name}:`, error)
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

        if (existing.docs.length > 0) {
          console.log(`✓ Blog post "${title}" already exists, skipping`)
          stats.blogPosts.skipped++
          blogPostIdMap.set(record.id, existing.docs[0].id)
          continue
        }

        const result = await payload.create({
          collection: 'blogPosts',
          data: {
            ...blogPostData,
            _status: 'published',
          },
        })

        blogPostIdMap.set(record.id, result.id)
        stats.blogPosts.created++
        console.log(`✓ Created blog post: ${title}`)
      } catch (error) {
        console.error(`✗ Error creating blog post ${title}:`, error)
        stats.blogPosts.skipped++
      }
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error)
  }
}

async function main() {
  console.log('🚀 Starting Airtable to Payload CMS migration...\n')

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    // Migrate in order: independent entities first, then relationships
    await migrateCountries(payload)
    await migrateCompanies(payload)
    await migrateCategories(payload)
    await migrateOrganisingGroups(payload)
    await migrateSolidarityActions(payload)
    await migrateBlogPosts(payload)

    // Print summary
    console.log('\n📊 Migration Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(
      `Countries:     ${stats.countries.created} created, ${stats.countries.skipped} skipped`,
    )
    console.log(
      `Companies:     ${stats.companies.created} created, ${stats.companies.skipped} skipped`,
    )
    console.log(
      `Categories:    ${stats.categories.created} created, ${stats.categories.skipped} skipped`,
    )
    console.log(
      `Organising Groups: ${stats.organisingGroups.created} created, ${stats.organisingGroups.skipped} skipped`,
    )
    console.log(
      `Solidarity Actions: ${stats.solidarityActions.created} created, ${stats.solidarityActions.skipped} skipped`,
    )
    console.log(
      `Blog Posts:    ${stats.blogPosts.created} created, ${stats.blogPosts.skipped} skipped`,
    )
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const totalCreated =
      stats.countries.created +
      stats.companies.created +
      stats.categories.created +
      stats.organisingGroups.created +
      stats.solidarityActions.created +
      stats.blogPosts.created

    console.log(`\n✅ Total: ${totalCreated} records created successfully!`)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

main()
