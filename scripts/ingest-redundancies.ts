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
  console.log(`\n📊 Found ${rows.length} redundancy records to process`)

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

  console.log(`\n🔄 Processing ${rows.length} rows...\n`)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      console.log(`\n[${i + 1}/${rows.length}] Processing row:`, {
        Studio: row.Studio,
        Date: row.Date,
        Headcount: row.Headcount,
        Parent: row.Parent,
      })

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
        console.error(
          `  ⚠️  Warning: Could not parse date "${dateStr}", using as-is:`,
          error.message,
        )
        // Try to continue with original date string
      }

      // Check if redundancy already exists (same studio + date)
      console.log(`  🔍 Checking for existing redundancy...`)
      const existing = await payload.find({
        collection: 'redundancies',
        where: {
          and: [{ studio: { equals: studioName } }, { date: { equals: normalizedDate } }],
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log(
          `  ⏭️  Skipping duplicate: ${studioName} on ${normalizedDate} (found existing: ${existing.docs[0].id})`,
        )
        stats.skipped++
        continue
      }
      console.log(`  ✓ No existing redundancy found, proceeding...`)

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
      } else {
        console.log(`  ℹ️  No parent company specified`)
      }

      // Create redundancy record
      const redundancyData = {
        studio: studioName,
        date: normalizedDate,
        headcount: headcount || undefined,
        parent: row.Parent?.trim() || undefined,
        type: row.Type?.trim() || undefined,
        studioLocation: row['Studio Location']?.trim() || undefined,
        parentLocation: row['Parent Location']?.trim() || undefined,
        company: companyId,
        parentCompany: parentCompanyId,
      }

      console.log(`  💾 Creating redundancy record with data:`, {
        studio: redundancyData.studio,
        date: redundancyData.date,
        headcount: redundancyData.headcount,
        companyId: companyId?.id || 'none',
        parentCompanyId: parentCompanyId?.id || 'none',
      })

      const created = await payload.create({
        collection: 'redundancies',
        data: redundancyData,
      })

      stats.created++
      console.log(
        `  ✅ Successfully created redundancy (ID: ${created.id}): ${studioName} (${headcount || 'unknown'} affected) - ${normalizedDate}`,
      )
    } catch (error: any) {
      console.error(`  ❌ Error processing row ${i + 1}:`, error.message)
      console.error(`  Error details:`, error)
      if (error.stack) {
        console.error(`  Stack trace:`, error.stack)
      }
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
  console.log(`Working directory: ${process.cwd()}`)

  console.log('\n📦 Initializing Payload...')
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  console.log('✓ Payload initialized successfully')

  // Verify collections exist
  console.log('\n🔍 Verifying collections...')
  try {
    const redundanciesCheck = await payload.find({
      collection: 'redundancies',
      limit: 1,
    })
    console.log(
      `✓ Redundancies collection accessible (existing records: ${redundanciesCheck.totalDocs})`,
    )
  } catch (error: any) {
    console.error(`✗ Error accessing redundancies collection:`, error.message)
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
