import { getPayload } from 'payload'
import { compareTwoStrings } from 'string-similarity'
import * as fs from 'fs'
import * as path from 'path'
import config from '../src/payload.config'

interface CsvRow {
  Studio: string
  Date: string
  Headcount: string
  Parent: string
  Type: string
  'Studio Location': string
  'Parent Location': string
}

interface RedundancyData {
  studio: string
  date: string
  headcount?: number
  parent?: string
  type?: string
  studioLocation?: string
  parentLocation?: string
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
  payload: any,
  name: string,
  threshold: number = 0.6,
): Promise<{ id: number | string } | null> {
  if (!name || !name.trim()) return null

  const normalizedSearch = normalizeName(name)

  // First try exact match (case-insensitive)
  const exactMatch = await payload.find({
    collection: 'companies',
    where: {
      Name: {
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
    const normalizedCompanyName = normalizeName(company.Name || '')
    const similarity = compareTwoStrings(normalizedSearch, normalizedCompanyName)

    if (similarity > (bestMatch?.score || 0) && similarity >= threshold) {
      bestMatch = { company, score: similarity }
    }
  }

  if (bestMatch) {
    console.log(
      `  ✓ Matched "${name}" to "${bestMatch.company.Name}" (similarity: ${(bestMatch.score * 100).toFixed(1)}%)`,
    )
    return { id: bestMatch.company.id }
  }

  return null
}

// Parse CSV file with proper handling of quoted fields
function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter((line) => line.trim())

  if (lines.length === 0) return []

  // Parse headers
  const headers = parseCsvLine(lines[0])

  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length === 0 || !values[0]) continue

    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = (values[index] || '').trim()
    })

    // Skip empty rows or header rows
    if (!row.Studio || row.Studio === 'Studio' || row.Studio === 'Field 1') {
      continue
    }

    rows.push(row as CsvRow)
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
  payload: any,
  name: string,
): Promise<{ id: number | string } | null> {
  if (!name || !name.trim()) return null

  const normalizedName = name.trim()

  // Check if exists
  const existing = await payload.find({
    collection: 'companies',
    where: {
      Name: {
        equals: normalizedName,
      },
    },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    return { id: existing.docs[0].id }
  }

  // Create new company
  try {
    const newCompany = await payload.create({
      collection: 'companies',
      data: {
        Name: normalizedName,
      },
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
        (c: any) => normalizeName(c.Name) === normalizeName(normalizedName),
      )

      if (match) {
        return { id: match.id }
      }
    }

    console.error(`  ✗ Error creating company "${normalizedName}":`, error.message)
    return null
  }
}

// Process redundancies from CSV
async function processRedundancies(filePath: string, payload: any) {
  console.log(`\n📂 Processing redundancies from ${path.basename(filePath)}...`)

  const rows = parseCsv(filePath)
  console.log(`Found ${rows.length} redundancy records`)

  const stats = {
    created: 0,
    skipped: 0,
    errors: 0,
    companiesMatched: 0,
    companiesCreated: 0,
  }

  for (const row of rows) {
    try {
      // Skip empty rows
      if (!row.Studio || !row.Date) {
        stats.skipped++
        continue
      }

      const studioName = row.Studio.trim()
      const date = row.Date.trim()

      // Check if redundancy already exists (same studio + date)
      const existing = await payload.find({
        collection: 'redundancies',
        where: {
          and: [{ studio: { equals: studioName } }, { date: { equals: date } }],
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log(`  ⏭️  Skipping duplicate: ${studioName} on ${date}`)
        stats.skipped++
        continue
      }

      // Parse headcount
      let headcount: number | undefined
      if (row.Headcount && row.Headcount.trim()) {
        const parsed = parseInt(row.Headcount.trim(), 10)
        if (!isNaN(parsed)) {
          headcount = parsed
        }
      }

      // Match or create company for studio
      let companyId: { id: number | string } | null = null
      if (studioName) {
        companyId = await findCompany(payload, studioName)
        if (!companyId) {
          companyId = await getOrCreateCompany(payload, studioName)
          if (companyId) {
            stats.companiesCreated++
          }
        } else {
          stats.companiesMatched++
        }
      }

      // Match or create company for parent
      let parentCompanyId: { id: number | string } | null = null
      if (row.Parent && row.Parent.trim()) {
        const parentName = row.Parent.trim()
        parentCompanyId = await findCompany(payload, parentName)
        if (!parentCompanyId) {
          parentCompanyId = await getOrCreateCompany(payload, parentName)
          if (parentCompanyId) {
            stats.companiesCreated++
          }
        } else {
          stats.companiesMatched++
        }
      }

      // Create redundancy record
      const redundancyData = {
        studio: studioName,
        date,
        headcount: headcount || undefined,
        parent: row.Parent?.trim() || undefined,
        type: row.Type?.trim() || undefined,
        studioLocation: row['Studio Location']?.trim() || undefined,
        parentLocation: row['Parent Location']?.trim() || undefined,
        company: companyId,
        parentCompany: parentCompanyId,
      }

      await payload.create({
        collection: 'redundancies',
        data: redundancyData,
      })

      stats.created++
      console.log(
        `  ✓ Created redundancy: ${studioName} (${headcount || 'unknown'} affected) - ${date}`,
      )
    } catch (error: any) {
      console.error(`  ✗ Error processing row:`, error.message)
      stats.errors++
    }
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
  console.log('🚀 Starting redundancy ingestion...\n')

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Process all CSV files
  const csvFiles = [
    '/Users/jan/Downloads/2025 Grid View.csv',
    '/Users/jan/Downloads/2024 Grid View Breakdown.csv',
    '/Users/jan/Downloads/2023 Grid View Breakdown.csv',
  ]

  const totalStats = {
    created: 0,
    skipped: 0,
    errors: 0,
    companiesMatched: 0,
    companiesCreated: 0,
  }

  for (const filePath of csvFiles) {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`)
      continue
    }

    const stats = await processRedundancies(filePath, payload)
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
