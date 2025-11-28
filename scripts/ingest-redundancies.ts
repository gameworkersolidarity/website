import { getPayload } from 'payload'
import { compareTwoStrings } from 'string-similarity'
import * as fs from 'fs'
import * as path from 'path'
import config from '../src/payload.config'
import { EventInitiator } from '@/collections/enums'
import { Company, Event } from '@/payload-types'
import { parseHTMLAsLexicalRichText } from '@/utils/payload'
import { slugify } from 'payload/shared'
import { payloadGetOrCreateModel } from '@/utils/payloadServer'

interface CsvRow {
  Studio: string
  Date: string
  Headcount: string
  Parent: string
  Type: string
  'Studio Location': string
  'Parent Location': string
}

// Normalize company names for better matching
function normalizeName(name: string): string {
  if (!name) return ''
  return name
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/[,\.]/g, '') // Remove commas and periods
    .toLowerCase()
}

// Find best matching company using fuzzy matching
async function findCompany(
  payload: Awaited<ReturnType<typeof getPayload>>,
  name: string,
  threshold: number = 0.6,
): Promise<{ id: number | string } | null> {
  if (!name || !name.trim()) return null

  const normalizedSearch = normalizeName(name)

  // First try exact match (case-insensitive)
  const exactMatch = await payload.find({
    collection: 'companies',
    where: {
      name: {
        like: name.trim(),
      },
    },
    limit: 1,
  })

  if (exactMatch.docs.length > 0) {
    return { id: exactMatch.docs[0].id }
  }

  // Get all companies for fuzzy matching
  const allCompanies = await payload.find({
    collection: 'companies',
    limit: 1000, // Adjust if needed
    pagination: false,
  })

  if (allCompanies.docs.length === 0) return null

  // Find best match using string similarity
  let bestMatch: { company: any; score: number } | null = null

  for (const company of allCompanies.docs) {
    const normalizedCompanyName = normalizeName(company.name || '')
    const similarity = compareTwoStrings(normalizedSearch, normalizedCompanyName)

    if (similarity > (bestMatch?.score || 0) && similarity >= threshold) {
      bestMatch = { company, score: similarity }
    }
  }

  if (bestMatch) {
    console.log(
      `  ✓ Matched "${name}" to "${bestMatch.company.name}" (similarity: ${(bestMatch.score * 100).toFixed(1)}%)`,
    )
    return { id: bestMatch.company.id }
  }

  return null
}

// Find best matching country using fuzzy matching
async function findCountry(
  payload: Awaited<ReturnType<typeof getPayload>>,
  name: string,
  threshold: number = 0.6,
): Promise<{ id: number | string } | null> {
  if (!name || !name.trim()) return null

  const normalizedSearch = normalizeName(name)

  // First try exact match (case-insensitive)
  const exactMatch = await payload.find({
    collection: 'countries',
    where: {
      name: {
        like: name.trim(),
      },
    },
    limit: 1,
  })

  if (exactMatch.docs.length > 0) {
    return { id: exactMatch.docs[0].id }
  }

  // Get all countries for fuzzy matching
  const allCountries = await payload.find({
    collection: 'countries',
    limit: 1000, // Adjust if needed
    pagination: false,
  })

  if (allCountries.docs.length === 0) return null

  // Find best match using string similarity
  let bestMatch: { country: any; score: number } | null = null

  for (const country of allCountries.docs) {
    const normalizedCountryName = normalizeName(country.name || '')
    const similarity = compareTwoStrings(normalizedSearch, normalizedCountryName)

    if (similarity > (bestMatch?.score || 0) && similarity >= threshold) {
      bestMatch = { country, score: similarity }
    }
  }

  if (bestMatch) {
    console.log(
      `  ✓ Matched country "${name}" to "${bestMatch.country.name}" (similarity: ${(bestMatch.score * 100).toFixed(1)}%)`,
    )
    return { id: bestMatch.country.id }
  }

  return null
}

// Parse CSV file with proper handling of quoted fields
function parseCsv(filePath: string): CsvRow[] {
  console.log(`\n📖 Reading CSV file: ${filePath}`)
  const content = fs.readFileSync(filePath, 'utf-8')
  console.log(`  File size: ${content.length} characters`)

  const lines = content.split('\n').filter((line) => line.trim())
  console.log(`  Total lines: ${lines.length}`)

  if (lines.length === 0) {
    console.log('  ⚠️  File is empty!')
    return []
  }

  // Parse headers
  const headers = parseCsvLine(lines[0])
  console.log(`  Headers: ${headers.join(', ')}`)
  console.log(`  Header count: ${headers.length}`)

  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length === 0 || !values[1]) {
      console.log(`  Skipping empty line ${i + 1}`)
      continue
    }

    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = (values[index] || '').trim()
    })

    // Skip empty rows or header rows
    if (!row.Studio || row.Studio === 'Studio' || row.Studio === 'Field 1') {
      console.log(`  Skipping header/invalid row ${i + 1}: "${row.Studio}"`)
      continue
    }

    rows.push(row as CsvRow)
  }

  console.log(`  ✓ Parsed ${rows.length} valid rows from CSV`)
  if (rows.length > 0) {
    console.log(`  First row sample: Studio="${rows[0].Studio}", Date="${rows[0].Date}"`)
  }

  return rows
}

// Parse a CSV line handling quoted fields
function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  values.push(current.trim())

  return values
}

// Create or get company
async function getOrCreateCompany(
  payload: Awaited<ReturnType<typeof getPayload>>,
  name: string,
): Promise<{ id: number | string } | null> {
  if (!name || !name.trim()) return null

  const normalizedName = name.trim()

  // Check if exists
  const existing = await payload.find({
    collection: 'companies',
    where: {
      name: {
        equals: normalizedName,
      },
    },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    return { id: existing.docs[0].id }
  }

  // Create new company
  const companyData: Omit<Company, 'id' | 'updatedAt' | 'createdAt'> = {
    name: normalizedName,
    slug: slugify(normalizedName) || normalizedName,
  }
  try {
    const newCompany = await payload.create({
      collection: 'companies',
      data: companyData,
    })
    console.log(`  ✓ Created new company: "${normalizedName}"`)
    return { id: newCompany.id }
  } catch (error: any) {
    // Handle unique constraint errors (name already exists with different casing)
    if (error.message?.includes('unique')) {
      const allCompanies = await payload.find({
        collection: 'companies',
        limit: 1000,
        pagination: false,
      })

      const match = allCompanies.docs.find(
        (c: any) => normalizeName(c.name) === normalizeName(normalizedName),
      )

      if (match) {
        return { id: match.id }
      }
    }

    console.error(`  ✗ Error creating company "${normalizedName}":`, error.message)
    console.error(JSON.stringify({ companyData }, null, 2))
    return null
  }
}

// Process redundancies from CSV and create Events
async function processRedundancies(
  filePath: string,
  payload: Awaited<ReturnType<typeof getPayload>>,
) {
  console.log(`\n📂 Processing redundancies from ${path.basename(filePath)} and creating Events...`)

  const rows = parseCsv(filePath)
  console.log(`\n📊 Found ${rows.length} redundancy records to process`)

  // Get Or Create Redundancy Category
  const REDUNDANCY_CATEGORY = await payloadGetOrCreateModel(
    payload,
    'categories',
    { name: 'Redundancy', slug: 'redundancy' },
    { name: 'Redundancy', slug: 'redundancy' },
  )

  if (rows.length === 0) {
    console.log('  ⚠️  No rows to process, skipping file')
    return {
      created: 0,
      skipped: 0,
      errors: 0,
      companiesMatched: 0,
      companiesCreated: 0,
    }
  }

  const stats = {
    created: 0,
    skipped: 0,
    errors: 0,
    companiesMatched: 0,
    companiesCreated: 0,
  }

  // Map to collect parent-child relationships: parentId -> Set of childIds
  const parentChildRelationships: {
    [parentId: string]: Set<string>
  } = {}

  console.log(`\n🔄 Processing ${rows.length} rows...\n`)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    // console.log(`\n[${i + 1}/${rows.length}] Processing row:`, {
    //   Studio: row.Studio,
    //   Date: row.Date,
    //   Headcount: row.Headcount,
    //   Parent: row.Parent,
    // })

    // Skip empty rows
    if (!row.Studio || !row.Date) {
      console.log(`  ⏭️  Skipping row ${i + 1}: missing Studio or Date`)
      stats.skipped++
      continue
    }

    const studioName = row.Studio.trim()
    const dateStr = row.Date.trim()
    console.log(`  Studio: "${studioName}", Date (raw): "${dateStr}"`)

    // Parse and normalize date format (Payload expects YYYY-MM-DD)
    let normalizedDate: string = dateStr
    try {
      // Try to parse the date and convert to ISO format
      const dateObj = new Date(dateStr)
      if (isNaN(dateObj.getTime())) {
        // If parsing fails, try common date formats
        // Example: "1/15/2024" or "15/1/2024" or "2024-01-15"
        const parts = dateStr.split(/[-\/]/)
        if (parts.length === 3) {
          // Assume MM/DD/YYYY or DD/MM/YYYY format
          let year = parseInt(parts[2])
          let month = parseInt(parts[0])
          let day = parseInt(parts[1])

          // If year is 2 digits, assume 20XX
          if (year < 100) {
            year += 2000
          }

          // If first part > 12, counterintuitively it's DD/MM format (European)
          if (month > 12) {
            // It's DD/MM/YYYY
            day = parseInt(parts[0])
            month = parseInt(parts[1])
            year = parseInt(parts[2])
            if (year < 100) year += 2000
          }

          normalizedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        } else {
          throw new Error(`Unable to parse date: ${dateStr}`)
        }
      } else {
        // Use ISO format
        normalizedDate = dateObj.toISOString().split('T')[0]
      }
      console.log(`  ✓ Normalized date: "${normalizedDate}"`)
    } catch (error: any) {
      console.error(`  ⚠️  Warning: Could not parse date "${dateStr}", using as-is:`, error.message)
      // Try to continue with original date string
    }

    // Check if event already exists (same title + date)
    const eventTitle = `Redundancies at ${studioName}`
    console.log(`  🔍 Checking for existing event...`)
    const existing = await payload.find({
      collection: 'events',
      where: {
        and: [{ name: { equals: eventTitle } }, { date: { equals: normalizedDate } }],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(
        `  ⏭️  Skipping duplicate: ${eventTitle} on ${normalizedDate} (found existing: ${existing.docs[0].id})`,
      )
      stats.skipped++
      continue
    }
    console.log(`  ✓ No existing event found, proceeding...`)

    // Parse headcount
    let headcount: number | undefined
    if (row.Headcount && row.Headcount.trim()) {
      const parsed = parseInt(row.Headcount.trim(), 10)
      if (!isNaN(parsed)) {
        headcount = parsed
        console.log(`  ✓ Parsed headcount: ${headcount}`)
      } else {
        console.log(`  ⚠️  Could not parse headcount: "${row.Headcount}"`)
      }
    }

    // Match or create company for studio
    let companyId: { id: number | string } | null = null
    if (studioName) {
      console.log(`  🔍 Looking up company for studio: "${studioName}"`)
      companyId = await findCompany(payload, studioName)
      if (!companyId) {
        console.log(`  ➕ Company not found, creating new company: "${studioName}"`)
        companyId = await getOrCreateCompany(payload, studioName)
        if (companyId) {
          stats.companiesCreated++
          console.log(`  ✓ Created company with ID: ${companyId.id}`)
        } else {
          console.log(`  ✗ Failed to create company: "${studioName}"`)
        }
      } else {
        stats.companiesMatched++
        console.log(`  ✓ Matched company with ID: ${companyId.id}`)
      }
    }

    // Match or create company for parent
    let parentCompanyId: { id: number | string } | null = null
    if (row.Parent && row.Parent.trim()) {
      const parentName = row.Parent.trim()
      console.log(`  🔍 Looking up company for parent: "${parentName}"`)
      parentCompanyId = await findCompany(payload, parentName)
      if (!parentCompanyId) {
        console.log(`  ➕ Parent company not found, creating new company: "${parentName}"`)
        parentCompanyId = await getOrCreateCompany(payload, parentName)
        if (parentCompanyId) {
          stats.companiesCreated++
          console.log(`  ✓ Created parent company with ID: ${parentCompanyId.id}`)
        } else {
          console.log(`  ✗ Failed to create parent company: "${parentName}"`)
        }
      } else {
        stats.companiesMatched++
        console.log(`  ✓ Matched parent company with ID: ${parentCompanyId.id}`)
      }

      // Collect parent-child relationship for later processing
      if (companyId && parentCompanyId) {
        const parentId = parentCompanyId.id.toString()
        const childId = companyId.id.toString()

        if (!parentChildRelationships[parentId]) {
          parentChildRelationships[parentId] = new Set<string>()
        }
        parentChildRelationships[parentId].add(childId)
        console.log(
          `  📝 Collected relationship: ${parentName} (${parentId}) → ${studioName} (${childId})`,
        )
      }
    } else {
      console.log(`  ℹ️  No parent company specified`)
    }

    // Match country from Studio Location or Parent Location
    let countryId: { id: number | string } | null = null
    const locationToMatch = row['Studio Location']?.trim() || row['Parent Location']?.trim()
    if (locationToMatch) {
      console.log(`  🔍 Looking up country for location: "${locationToMatch}"`)
      countryId = await findCountry(payload, locationToMatch)
      if (countryId) {
        console.log(`  ✓ Matched country with ID: ${countryId.id}`)
      } else {
        console.log(`  ⚠️  Could not match country for location: "${locationToMatch}"`)
      }
    } else {
      console.log(`  ℹ️  No location specified for country matching`)
    }

    // Build description from redundancy data
    const descriptionParts: string[] = []
    if (headcount) {
      descriptionParts.push(`${headcount} workers affected`)
    }
    if (row.Type?.trim()) {
      descriptionParts.push(`Type: ${row.Type.trim()}`)
    }
    if (row.Parent?.trim()) {
      descriptionParts.push(`Parent company: ${row.Parent.trim()}`)
    }
    if (row['Studio Location']?.trim()) {
      descriptionParts.push(`Studio location: ${row['Studio Location'].trim()}`)
    }
    const descriptionText = descriptionParts.join('. ') + (descriptionParts.length > 0 ? '.' : '')

    // Collect company IDs for the companies relationship (only studio company, not parent)
    const companyIds: string[] = []
    if (companyId) {
      companyIds.push(companyId.id.toString())
    }
    // Note: Parent companies are linked via the company's Parents relationship, not added to event

    // Collect country IDs
    const countryIds: string[] = []
    if (countryId) {
      countryIds.push(countryId.id.toString())
    }

    // Determine location (prefer studio location, fallback to parent location)
    const eventLocation =
      row['Studio Location']?.trim() || row['Parent Location']?.trim() || undefined

    // Create event record
    const eventData: Omit<Event, 'id' | 'updatedAt' | 'createdAt'> = {
      name: eventTitle,
      slug: slugify(eventTitle) || eventTitle,
      date: normalizedDate,
      headcount: headcount || undefined,
      location: eventLocation,
      description: parseHTMLAsLexicalRichText(descriptionText),
      source: 'https://publish.obsidian.md/vg-layoffs/Archive/2025',
      companies: companyIds.length > 0 ? companyIds : undefined,
      countries: countryIds.length > 0 ? countryIds : undefined,
      initiator: EventInitiator.BOSS_LED,
      categories: [REDUNDANCY_CATEGORY.id],
    }

    console.log(`  💾 Creating event record with data:`, {
      name: eventData.name,
      date: eventData.date,
      headcount: eventData.headcount,
      location: eventData.location,
      companyIds: companyIds.length > 0 ? companyIds : 'none',
      countryIds: countryIds.length > 0 ? countryIds : 'none',
    })

    try {
      const created = await payload.create({
        collection: 'events',
        data: eventData,
      })

      stats.created++
      console.log(
        `  ✅ Successfully created event (ID: ${created.id}): ${eventTitle} (${headcount || 'unknown'} affected) - ${normalizedDate}`,
      )
    } catch (error: any) {
      console.error(`  ❌ Error processing row ${i + 1}:`, error.message)
      console.error(JSON.stringify({ eventData }, null, 2))
      console.error(`  Error details:`, error)
      if (error.stack) {
        console.error(`  Stack trace:`, error.stack)
      }
      stats.errors++
    }
  }

  // Set children relationships on parent companies after all companies are created
  if (Object.keys(parentChildRelationships).length > 0) {
    console.log(`\n🔗 Setting parent-child relationships...`)
    let relationshipsSet = 0
    let relationshipsSkipped = 0

    for (const parentId in parentChildRelationships) {
      const childIds = parentChildRelationships[parentId]
      try {
        // Get current parent company to check existing children
        const parentCompany = await payload.findByID({
          collection: 'companies',
          id: parentId,
        })
        const existingChildren = parentCompany.children || []
        const existingChildIds = Array.isArray(existingChildren)
          ? new Set(existingChildren.map((c: any) => (typeof c === 'string' ? c : c.id)))
          : new Set()

        // Merge with new children
        const allChildIds = Array.from(new Set([...existingChildIds, ...childIds]))

        // Update parent company with all children
        await payload.update({
          collection: 'companies',
          id: parentId,
          data: {
            children: allChildIds,
          },
        })

        const newChildrenCount = Array.from(childIds).filter(
          (id) => !existingChildIds.has(id),
        ).length
        relationshipsSet += newChildrenCount
        console.log(
          `  ✓ Updated parent company ${parentId}: added ${newChildrenCount} child${newChildrenCount !== 1 ? 'ren' : ''} (total: ${allChildIds.length})`,
        )
      } catch (error: any) {
        console.warn(`  ⚠️  Could not update parent company ${parentId}:`, error.message)
        relationshipsSkipped += childIds.size
      }
    }

    console.log(
      `  ✅ Set ${relationshipsSet} parent-child relationship${relationshipsSet !== 1 ? 's' : ''}${relationshipsSkipped > 0 ? ` (${relationshipsSkipped} skipped)` : ''}`,
    )
  }

  console.log(`\n📊 Statistics:`)
  console.log(`  Created: ${stats.created}`)
  console.log(`  Skipped: ${stats.skipped}`)
  console.log(`  Errors: ${stats.errors}`)
  console.log(`  Companies matched: ${stats.companiesMatched}`)
  console.log(`  Companies created: ${stats.companiesCreated}`)

  return stats
}

// Main function
async function main() {
  console.log('🚀 Starting redundancy ingestion (creating Events)...\n')
  console.log(`Working directory: ${process.cwd()}`)

  console.log('\n📦 Initializing Payload...')
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  console.log('✓ Payload initialized successfully')

  // Verify collections exist
  console.log('\n🔍 Verifying collections...')
  try {
    const eventsCheck = await payload.find({
      collection: 'events',
      limit: 1,
    })
    console.log(`✓ Events collection accessible (existing records: ${eventsCheck.totalDocs})`)
  } catch (error: any) {
    console.error(`✗ Error accessing events collection:`, error.message)
  }

  try {
    const companiesCheck = await payload.find({
      collection: 'companies',
      limit: 1,
    })
    console.log(`✓ Companies collection accessible (existing records: ${companiesCheck.totalDocs})`)
  } catch (error: any) {
    console.error(`✗ Error accessing companies collection:`, error.message)
  }

  try {
    const countriesCheck = await payload.find({
      collection: 'countries',
      limit: 1,
    })
    console.log(`✓ Countries collection accessible (existing records: ${countriesCheck.totalDocs})`)
  } catch (error: any) {
    console.error(`✗ Error accessing countries collection:`, error.message)
  }

  // Process all CSV files from public/redundancies/ directory
  const redundanciesDir = path.join(process.cwd(), 'public', 'redundancies')
  const csvFiles = [
    path.join(redundanciesDir, '2025 Grid View.csv'),
    path.join(redundanciesDir, '2024 Grid View Breakdown.csv'),
    path.join(redundanciesDir, '2023 Grid View Breakdown.csv'),
    path.join(redundanciesDir, '2022 Grid View Breakdown.csv'),
  ]

  const totalStats = {
    created: 0,
    skipped: 0,
    errors: 0,
    companiesMatched: 0,
    companiesCreated: 0,
  }

  for (const filePath of csvFiles) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`Checking file: ${filePath}`)
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`)
      console.warn(`   Please ensure the file exists at this path`)
      continue
    }

    console.log(`✓ File exists, proceeding with processing...`)
    const stats = await processRedundancies(filePath, payload)

    console.log(`\n📈 File processing complete:`)
    console.log(`  Created: ${stats.created}`)
    console.log(`  Skipped: ${stats.skipped}`)
    console.log(`  Errors: ${stats.errors}`)

    totalStats.created += stats.created
    totalStats.skipped += stats.skipped
    totalStats.errors += stats.errors
    totalStats.companiesMatched += stats.companiesMatched
    totalStats.companiesCreated += stats.companiesCreated
  }

  console.log('\n✅ Ingestion complete!')
  console.log('\n📊 Total Statistics:')
  console.log(`  Created: ${totalStats.created}`)
  console.log(`  Skipped: ${totalStats.skipped}`)
  console.log(`  Errors: ${totalStats.errors}`)
  console.log(`  Companies matched: ${totalStats.companiesMatched}`)
  console.log(`  Companies created: ${totalStats.companiesCreated}`)

  process.exit(0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
