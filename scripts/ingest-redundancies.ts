import 'dotenv/config'
import { Command } from 'commander'
import { createHash } from 'crypto'
import { getPayload } from 'payload'
import { compareTwoStrings } from 'string-similarity'
import { parse } from 'csv-parse/sync'
import { format, parse as parseDate } from 'date-fns'
import * as fs from 'fs'
import * as path from 'path'
import config from '../src/payload.config'
import { ActionInitiator } from '@/collections/enums'
import { Company, Action, Country } from '@/payload-types'
import { slugify } from 'payload/shared'
import { payloadGetOrCreateModel } from '@/utils/payloadServer'
import { htmlToLexical } from '@/utils/htmlToLexical'
import { geocodeWithMapboxV6 } from '@/utils/mapbox-geocode'
import { countryToAlpha2 } from 'country-to-iso'

interface CsvRow {
  Studio: string
  Date: string
  Headcount: string
  Parent: string
  Type: string
  'Studio Location': string
  'Parent Location': string
}

/** Required CSV headers (must match exactly for a file to be processed). */
const REQUIRED_CSV_HEADERS = [
  'Field 1',
  'Studio',
  'Date',
  'Headcount',
  'Parent',
  'Type',
  'Studio Location',
  'Parent Location',
] as const

/** Cache: company string (trimmed) -> Payload company id. Reused for consistency across rows/files. */
type CompanyIdCache = Map<string, { id: number | string }>

/** Cache: location string (trimmed) -> Country object. Reused to avoid repeated geocoding API calls. */
type GeocodeCache = Map<string, Country>

const UTF8_BOM = '\uFEFF'

/** Read CSV headers using csv-parse (first line as column names). */
function getCsvHeaders(filePath: string): string[] {
  let content = fs.readFileSync(filePath, 'utf-8')
  if (content.startsWith(UTF8_BOM)) content = content.slice(UTF8_BOM.length)
  // Parse with columns: true so first line is used as headers; to_line: 2 gives at most one record
  const records = parse(content, {
    columns: true,
    trim: true,
    skip_empty_lines: true,
    to_line: 2,
    relax_column_count: true,
    relax_quotes: true,
  }) as Record<string, string>[]
  if (records.length > 0) {
    return Object.keys(records[0])
  }
  // Header-only or empty: parse first line as raw row with csv-parse
  const firstRow = parse(content, {
    columns: false,
    trim: true,
    to_line: 1,
    relax_column_count: true,
  }) as string[][]
  return (firstRow[0] ?? []).map((c) => (c ?? '').trim())
}

/** Return true if the CSV file has exactly the required headers (order-independent). */
function csvMatchesSchema(filePath: string): boolean {
  const headers = getCsvHeaders(filePath)
  if (headers.length !== REQUIRED_CSV_HEADERS.length) return false
  const requiredSet = new Set<string>(REQUIRED_CSV_HEADERS)
  return headers.every((h) => requiredSet.has(h))
}

/** Deterministic hash of a CSV row for idempotent deduplication (stored in Action.airtableId). */
function hashRow(row: CsvRow): string {
  const canonical: Record<string, string> = {
    Date: (row.Date ?? '').trim(),
    Headcount: (row.Headcount ?? '').trim(),
    Parent: (row.Parent ?? '').trim(),
    'Parent Location': (row['Parent Location'] ?? '').trim(),
    Studio: (row.Studio ?? '').trim(),
    'Studio Location': (row['Studio Location'] ?? '').trim(),
    Type: (row.Type ?? '').trim(),
  }
  const json = JSON.stringify(canonical)
  return createHash('sha256').update(json).digest('hex')
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
  threshold: number = 0.875,
) {
  if (!name || !name.trim()) return null

  const normalizedSearch = normalizeName(name)

  // First try exact match (case-insensitive)
  const exactMatch = await payload.find({
    collection: 'companies',
    where: {
      name: {
        equals: name.trim(),
      },
    },
    limit: 1,
  })

  if (exactMatch.docs.length > 0) {
    return exactMatch.docs[0]
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
    return bestMatch.company
  }

  return null
}

// Find best matching country using fuzzy matching
async function findCountry(
  payload: Awaited<ReturnType<typeof getPayload>>,
  name: string,
  threshold: number = 0.6,
): Promise<Country | null> {
  if (!name || !name.trim()) return null

  const normalizedSearch = normalizeName(name)

  // First try exact match (case-insensitive)
  const exactMatch = await payload.find({
    collection: 'countries',
    where: {
      or: [
        {
          name: {
            equals: name.trim(),
          },
        },
        {
          isoA2: {
            equals: countryToAlpha2(name.trim()),
          },
        },
      ],
    },
    limit: 1,
  })

  if (exactMatch.docs.length > 0) {
    return exactMatch.docs[0]
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
    return bestMatch.country
  }

  return null
}

// Parse CSV file using csv-parse (handles quoted fields, escaped quotes, etc.)
function parseCsv(filePath: string): CsvRow[] {
  console.log(`\n📖 Reading CSV file: ${filePath}`)
  let content = fs.readFileSync(filePath, 'utf-8')
  if (content.startsWith(UTF8_BOM)) content = content.slice(UTF8_BOM.length)
  console.log(`  File size: ${content.length} characters`)

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Record<string, string>[]

  console.log(`  Total records: ${records.length}`)

  if (records.length === 0) {
    console.log('  ⚠️  File is empty or has no data rows!')
    return []
  }

  const headers = Object.keys(records[0] ?? {})
  console.log(`  Headers: ${headers.join(', ')}`)
  console.log(`  Header count: ${headers.length}`)

  const rows: CsvRow[] = []
  for (let i = 0; i < records.length; i++) {
    const row = records[i] as unknown as Record<keyof CsvRow, string>
    if (!row?.Studio?.trim()) {
      console.log(`  Skipping empty line ${i + 2}`)
      continue
    }
    // Skip header-like rows
    if (row.Studio === 'Studio' || row.Studio === 'Field 1') {
      console.log(`  Skipping header/invalid row ${i + 2}: "${row.Studio}"`)
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

// Create or get company
async function getOrCreateCompany(
  payload: Awaited<ReturnType<typeof getPayload>>,
  name: string,
  dryRun?: boolean,
  countryId?: { id: number | string } | null,
): Promise<{ id: number | string } | Company | null> {
  if (!name || !name.trim()) return null

  const normalizedName = name.trim()

  // Check if exists (exact match)
  const existing = await findCompany(payload, normalizedName)
  if (existing) {
    return existing
  }

  if (dryRun) {
    const countryInfo = countryId ? ` with country (ID: ${countryId.id})` : ''
    console.log(`  [dry-run] Would create company: "${normalizedName}" (${countryInfo})`)
    return { id: `dry-run:company:${normalizedName}` }
  }

  // Create new company (DRY RUN CHECK: dryRun was checked above, this code should never execute in dry-run mode)
  const companyData: Omit<Company, 'id' | 'updatedAt' | 'createdAt'> = {
    name: normalizedName,
    slug: slugify(normalizedName) || normalizedName,
    countries: countryId ? [countryId.id.toString()] : undefined,
  }
  try {
    const newCompany = await payload.create({
      collection: 'companies',
      data: {
        ...companyData,
        _status: 'draft',
      },
    })
    const countryInfo = countryId ? ` with country (ID: ${countryId.id})` : ''
    console.log(`  ✓ Created new company: "${normalizedName}"${countryInfo}`)
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
        // Update with country if provided (DRY RUN CHECK: This code should never execute in dry-run mode)
        if (countryId && !dryRun) {
          try {
            const existingCountryIds = (match.countries || []).map((c: any) =>
              typeof c === 'string' ? c : c.id,
            )
            if (!existingCountryIds.includes(countryId.id.toString())) {
              await payload.update({
                collection: 'companies',
                id: match.id,
                data: {
                  countries: [...existingCountryIds, countryId.id.toString()],
                },
              })
              console.log(
                `  ✓ Updated matched company "${normalizedName}" with country (ID: ${countryId.id})`,
              )
            }
          } catch (updateError: any) {
            // Silently fail - country update is optional
          }
        }
        return match
      }
    }

    console.error(`  ✗ Error creating company "${normalizedName}":`, error.message)
    console.error(JSON.stringify({ companyData }, null, 2))
    return null
  }
}

// Process redundancies from CSV and create Actions
async function processRedundancies(
  filePath: string,
  payload: Awaited<ReturnType<typeof getPayload>>,
  companyCache: CompanyIdCache,
  geocodeCache: GeocodeCache,
  dryRun: boolean,
  maxRemaining?: number,
) {
  console.log(
    `\n📂 Processing redundancies from ${path.basename(filePath)} and creating Actions...`,
  )
  if (maxRemaining !== undefined) {
    console.log(`  (max ${maxRemaining} to import in this run)`)
  }

  const rows = parseCsv(filePath)
  console.log(`\n📊 Found ${rows.length} redundancy records to process`)

  // Get Or Create Redundancy Category (skip in dry-run to avoid creating; use placeholder for action log)
  const REDUNDANCY_CATEGORY = dryRun
    ? { id: 'dry-run:redundancy-category' as string }
    : await payloadGetOrCreateModel(
        payload,
        'categories',
        { slug: 'redundancy' },
        { name: 'Redundancy', slug: 'redundancy', _status: 'published' },
      )

  if (rows.length === 0) {
    console.log('  ⚠️  No rows to process, skipping file')
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      companiesMatched: 0,
      companiesCreated: 0,
    }
  }

  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    companiesMatched: 0,
    companiesCreated: 0,
  }

  // Map to collect parent-child relationships: parentId -> Set of childIds
  const parentChildRelationships: {
    [childId: string]: string
  } = {}

  console.log(`\n🔄 Processing ${rows.length} rows...\n`)

  for (let i = 0; i < rows.length; i++) {
    if (maxRemaining !== undefined && stats.created + stats.updated >= maxRemaining) {
      console.log(`  ⏹️  Reached max import limit (${maxRemaining}), stopping.`)
      break
    }

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

    // Deterministic row hash for idempotent deduplication (stored in airtableId)
    const rowHash = hashRow(row)

    // Find existing action by row hash (so we can update if script interpretation changed)
    const existingByHash = await payload.find({
      collection: 'actions',
      where: { airtableId: { equals: rowHash } },
      limit: 1,
    })
    const existingAction = existingByHash.docs[0] ?? null

    // Parse date (redundancies CSVs use YYYY-MM-DD) and format for Payload
    let normalizedDate: string = dateStr
    try {
      const date = parseDate(dateStr, 'yyyy-MM-dd', new Date())
      normalizedDate = format(date, 'yyyy-MM-dd')
      console.log(`  ✓ Parsed date: "${normalizedDate}"`)
    } catch (error: any) {
      console.error(`  ⚠️  Could not parse date "${dateStr}", using as-is:`, error.message)
    }

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

    const actionTitle = headcount
      ? `${studioName} bosses lay off ${headcount} game workers`
      : `${studioName} bosses lay off game workers`

    // Match country from Studio Location (preferred) or Parent Location (only if Studio Location is null)
    // Do this BEFORE company creation so we can set country on companies
    let countryId: Country | null = null
    let matchedCountryName: string | null = null
    const studioLocationForCountry = row['Studio Location']?.trim()
    const parentLocationForCountry = row['Parent Location']?.trim()

    // Only use Parent Location for country matching if Studio Location is null/empty
    const locationToMatch = studioLocationForCountry || parentLocationForCountry

    if (locationToMatch) {
      const locationSource = studioLocationForCountry ? 'Studio Location' : 'Parent Location'
      console.log(`  🔍 Looking up country for ${locationSource}: "${locationToMatch}"`)
      countryId = await findCountry(payload, locationToMatch)
      if (countryId) {
        // Fetch the country name for logging
        try {
          const country = await payload.findByID({
            collection: 'countries',
            id: countryId.id,
          })
          matchedCountryName = country.name
        } catch {
          // If fetch fails, just use the ID
        }
        console.log(
          `  ✓ Matched country: "${locationToMatch}" → "${matchedCountryName || locationToMatch}" (ID: ${countryId.id})`,
        )
      } else {
        // Try geocoding with Mapbox v6 if fuzzy matching failed (only for Studio Location, not Parent Location)
        if (studioLocationForCountry) {
          // Check geocode cache first
          const cachedCountry = geocodeCache.get(locationToMatch)
          if (cachedCountry) {
            countryId = cachedCountry
            matchedCountryName = cachedCountry.name
            console.log(
              `  ✓ Matched country via geocode cache: "${locationToMatch}" → "${matchedCountryName}" (ID: ${cachedCountry.id})`,
            )
          } else {
            console.log(
              `  ⚠️  Could not match country via fuzzy matching, trying Mapbox v6 geocoding...`,
            )
            try {
              const geoResult = await geocodeWithMapboxV6(locationToMatch)
              if (geoResult?.countryCode) {
                const countryCode = geoResult.countryCode.toUpperCase()
                console.log(
                  `  🌍 Geocoded location "${locationToMatch}" → country code: ${countryCode} (${geoResult.countryName || 'unknown country'})`,
                )

                // Find country by ISO A2 code
                const countryByCode = await payload.find({
                  collection: 'countries',
                  where: {
                    isoA2: {
                      equals: countryCode,
                    },
                  },
                  limit: 1,
                })

                if (countryByCode.docs.length > 0) {
                  const foundCountry = countryByCode.docs[0]
                  countryId = foundCountry
                  matchedCountryName = foundCountry.name
                  // Store in cache for future use
                  geocodeCache.set(locationToMatch, foundCountry)
                  console.log(
                    `  ✓ Matched country via Mapbox v6 geocoding: "${locationToMatch}" → "${matchedCountryName}" (ID: ${foundCountry.id})`,
                  )
                } else {
                  console.log(
                    `  ⚠️  Geocoded country code "${countryCode}" not found in Payload countries`,
                  )
                }
              } else {
                console.log(
                  `  ⚠️  Mapbox v6 geocoding did not return a country code for "${locationToMatch}"`,
                )
              }
            } catch (error: any) {
              console.log(
                `  ⚠️  Mapbox v6 geocoding failed for "${locationToMatch}": ${error.message}`,
              )
            }
          }
        }

        if (!countryId) {
          console.log(`  ⚠️  Could not identify country for location: "${locationToMatch}"`)
        }
      }
    } else {
      console.log(`  ℹ️  No location specified for country matching`)
    }

    // Match or create company for studio (use cache for consistency)
    let companyId: { id: number | string } | null = null
    let matchedCompanyName: string | null = null
    if (studioName) {
      const cached = companyCache.get(studioName)
      if (cached) {
        companyId = cached
        // Fetch the company name for logging
        if (typeof cached.id !== 'string' || !cached.id.startsWith('dry-run:')) {
          try {
            const cachedCompany = await payload.findByID({
              collection: 'companies',
              id: cached.id,
            })
            matchedCompanyName = cachedCompany.name
          } catch {
            // If fetch fails, just use the cached ID
          }
        }
        console.log(
          `  🔍 Company for studio (cached): "${studioName}" → "${matchedCompanyName || studioName}" (ID: ${companyId.id})`,
        )
      } else {
        console.log(`  🔍 Looking up company for studio: "${studioName}"`)
        const found = await findCompany(payload, studioName)
        if (found) {
          companyId = { id: found.id }
          matchedCompanyName = found.name
          companyCache.set(studioName, companyId)
          stats.companiesMatched++
          console.log(
            `  ✓ Matched company: "${studioName}" → "${matchedCompanyName}" (ID: ${companyId.id})`,
          )
        } else {
          console.log(`  ➕ Company not found, creating new company: "${studioName}"`)
          const created = await getOrCreateCompany(payload, studioName, dryRun, countryId)
          if (created) {
            companyId = { id: created.id }
            companyCache.set(studioName, companyId)
            stats.companiesCreated++
            if (dryRun) {
              console.log(`  ✓ [dry-run] Would create company: "${studioName}"`)
            } else {
              console.log(`  ✓ Created company: "${studioName}" (ID: ${companyId.id})`)
            }
          } else {
            console.log(`  ✗ Failed to create company: "${studioName}"`)
          }
        }
      }
    }

    // Match or create company for parent (use cache for consistency)
    let parentCompanyId: { id: number | string } | null = null
    let matchedParentCompanyName: string | null = null
    if (row.Parent && row.Parent.trim()) {
      const parentName = row.Parent.trim()
      const cached = companyCache.get(parentName)
      if (cached) {
        parentCompanyId = cached
        // Fetch the company name for logging
        if (typeof cached.id !== 'string' || !cached.id.startsWith('dry-run:')) {
          try {
            const cachedCompany = await payload.findByID({
              collection: 'companies',
              id: cached.id,
            })
            matchedParentCompanyName = cachedCompany.name
          } catch {
            // If fetch fails, just use the cached ID
          }
        }
        console.log(
          `  🔍 Company for parent (cached): "${parentName}" → "${matchedParentCompanyName || parentName}" (ID: ${parentCompanyId.id})`,
        )
      } else {
        console.log(`  🔍 Looking up company for parent: "${parentName}"`)
        const found = await findCompany(payload, parentName)
        if (found) {
          parentCompanyId = { id: found.id }
          matchedParentCompanyName = found.name
          companyCache.set(parentName, parentCompanyId)
          stats.companiesMatched++
          console.log(
            `  ✓ Matched parent company: "${parentName}" → "${matchedParentCompanyName}" (ID: ${parentCompanyId.id})`,
          )
        } else {
          console.log(`  ➕ Parent company not found, creating new company: "${parentName}"`)
          const created = await getOrCreateCompany(payload, parentName, dryRun, countryId)
          if (created) {
            parentCompanyId = { id: created.id }
            companyCache.set(parentName, parentCompanyId)
            stats.companiesCreated++
            if (dryRun) {
              console.log(`  ✓ [dry-run] Would create parent company: "${parentName}"`)
            } else {
              console.log(`  ✓ Created parent company: "${parentName}" (ID: ${parentCompanyId.id})`)
            }
          } else {
            console.log(`  ✗ Failed to create parent company: "${parentName}"`)
          }
        }
      }

      // Collect parent-child relationship for later processing
      if (companyId && parentCompanyId && parentCompanyId.id !== companyId.id) {
        const parentId = parentCompanyId.id.toString()
        const childId = companyId.id.toString()
        parentChildRelationships[childId] = parentId
        console.log(
          `  📝 Collected relationship: ${parentName} (${parentId}) → ${studioName} (${childId})`,
        )
      }
    } else {
      console.log(`  ℹ️  No parent company specified`)
    }

    // Collect company IDs for the companies relationship (only studio company, not parent)
    const companyIds: string[] = []
    if (companyId) {
      companyIds.push(companyId.id.toString())
    }
    // Note: Parent companies are linked via the company's Parents relationship, not added to action

    // Collect country IDs
    const countryIds: string[] = []
    if (countryId) {
      countryIds.push(countryId.id.toString())
    }

    // Determine location: use Studio Location if it's different from the matched country name
    // Only use Parent Location if Studio Location is null/empty in CSV (not if it exists but can't be geocoded)
    let actionLocation: string | undefined = undefined
    const studioLocation = row['Studio Location']?.trim()
    if (studioLocation) {
      // Studio Location exists in CSV - use it if it differs from matched country name
      // Normalize both for comparison (case-insensitive, trimmed)
      const normalizedStudioLocation = studioLocation.toLowerCase().trim()
      const normalizedCountryName = matchedCountryName?.toLowerCase().trim() || ''

      if (normalizedCountryName && normalizedStudioLocation !== normalizedCountryName) {
        // Studio location is different from matched country name, use it
        actionLocation = studioLocation
        console.log(
          `  📍 Using Studio Location "${studioLocation}" (differs from matched country "${matchedCountryName}")`,
        )
      } else if (!normalizedCountryName) {
        // No country matched, use studio location anyway
        actionLocation = studioLocation
        console.log(`  📍 Using Studio Location "${studioLocation}" (no country matched)`)
      } else {
        // Studio location matches country name, don't set location field
        console.log(
          `  ℹ️  Studio Location "${studioLocation}" matches country "${matchedCountryName}", not setting location field`,
        )
      }
      // Note: Even if Studio Location can't be geocoded, we don't fall back to Parent Location
    } else {
      // Studio Location is null/empty in CSV - only then use Parent Location as fallback
      const parentLocation = row['Parent Location']?.trim()
      if (parentLocation) {
        actionLocation = parentLocation
        console.log(
          `  📍 Using Parent Location "${parentLocation}" (Studio Location is null/empty in CSV)`,
        )
      } else {
        console.log(
          `  ℹ️  No location available (both Studio Location and Parent Location are null/empty)`,
        )
      }
    }

    // Create action record (slug includes date so same studio on different dates get unique slugs)
    const actionSlug =
      slugify(`${normalizedDate} ${actionTitle} `) ||
      `${normalizedDate}-${slugify(actionTitle) || actionTitle}`
        .trim()
        .replace(/-$/, '')
        .replace(/^-/, '')
    const actionData: Omit<Action, 'id' | 'updatedAt' | 'createdAt'> = {
      name: actionTitle,
      slug: actionSlug,
      date: normalizedDate,
      headcount: headcount || undefined,
      location: actionLocation,
      source: 'https://publish.obsidian.md/vg-layoffs/Archive/2025',
      companies: companyIds.length > 0 ? companyIds : undefined,
      countries: countryIds.length > 0 ? countryIds : undefined,
      initiator: ActionInitiator.BOSS_LED,
      categories: REDUNDANCY_CATEGORY ? [REDUNDANCY_CATEGORY.id] : undefined,
      airtableId: rowHash,
    }

    console.log(`  💾 Creating action record with data:`, actionData)

    if (dryRun) {
      console.log(
        existingAction
          ? `  [dry-run] Would update action (ID: ${existingAction.id}): "${actionTitle}" (${headcount ?? 'unknown'} affected) ${normalizedDate}`
          : `  [dry-run] Would create action: "${actionTitle}" (${headcount ?? 'unknown'} affected) ${normalizedDate}`,
      )
      console.log(
        `  [dry-run]   companies: ${companyIds.length > 0 ? companyIds.join(', ') : 'none'}`,
      )
      if (existingAction) stats.updated++
      else stats.created++
    } else {
      // DRY RUN CHECK: This else block only executes when !dryRun, so payload writes are safe here
      try {
        if (existingAction) {
          await payload.update({
            collection: 'actions',
            id: existingAction.id,
            data: {
              ...actionData,
              _status: 'draft',
            },
          })
          stats.updated++
          console.log(
            `  ✅ Updated action (ID: ${existingAction.id}): ${actionTitle} (${headcount || 'unknown'} affected) - ${normalizedDate}`,
          )
        } else {
          await payload.create({
            collection: 'actions',
            data: {
              ...actionData,
              _status: 'draft',
            },
          })
          stats.created++
          console.log(
            `  ✅ Successfully created action: ${actionTitle} (${headcount || 'unknown'} affected) - ${normalizedDate}`,
          )
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing row ${i + 1}:`, error.message)
        console.error(JSON.stringify({ actionData }, null, 2))
        console.error(`  Error details:`, error)
        if (error.stack) {
          console.error(`  Stack trace:`, error.stack)
        }
        stats.errors++
      }
    }
  }

  // Set parent company on child companies
  if (Object.keys(parentChildRelationships).length > 0) {
    console.log(`\n🔗 Setting parent company on child companies...`)
    for (const childId in parentChildRelationships) {
      const parentId = parentChildRelationships[childId]
      if (dryRun) {
        console.log(
          `  [dry-run] Would set parent of company "${childId}" → parent company "${parentId}"`,
        )
      } else {
        // DRY RUN CHECK: This else block only executes when !dryRun, so payload writes are safe here
        console.log(`  🔍 Setting parent company on child company: "${childId}"`, { parentId })
        if (childId && parentId) {
          const updateOp = {
            collection: 'companies',
            id: childId,
            data: {
              parent: { id: parentId },
            },
          } as any
          try {
            await payload.update(updateOp)
          } catch (error: any) {
            console.error(
              `  ❌ Error setting parent company on child company: "${childId}"`,
              error.message,
            )
            console.error(JSON.stringify({ updateOp }, null, 2))
            stats.errors++
          }
        }
      }
    }
  }

  console.log(`\n📊 Statistics:`)
  console.log(`  Created: ${stats.created}`)
  console.log(`  Updated: ${stats.updated}`)
  console.log(`  Skipped: ${stats.skipped}`)
  console.log(`  Errors: ${stats.errors}`)
  console.log(`  Companies matched: ${stats.companiesMatched}`)
  console.log(`  Companies created: ${stats.companiesCreated}`)

  return stats
}

// Run ingestion with optional dry-run, file filter, and max limit
async function run(options: { dryRun: boolean; file?: string; max?: number }) {
  const { dryRun, file: fileFilter, max: maxImports } = options

  console.log('🚀 Starting redundancy ingestion (creating Actions)...\n')
  if (dryRun) {
    console.log(
      '🔍 DRY RUN – no changes will be saved to Payload (company matching & parent/child only)\n',
    )
  }
  console.log(`Working directory: ${process.cwd()}`)

  console.log('\n📦 Initializing Payload...')
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  console.log('✓ Payload initialized successfully')

  // Verify collections exist
  console.log('\n🔍 Verifying collections...')
  try {
    const actionsCheck = await payload.find({
      collection: 'actions',
      limit: 1,
    })
    console.log(`✓ Actions collection accessible (existing records: ${actionsCheck.totalDocs})`)
  } catch (error: any) {
    console.error(`✗ Error accessing actions collection:`, error.message)
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

  // Discover all CSV files in public/redundancies/ that match the required schema
  const redundanciesDir = path.join(process.cwd(), 'public', 'redundancies')
  const allFiles = fs.readdirSync(redundanciesDir, { withFileTypes: true })
  const csvFiles = allFiles
    .filter((f) => f.isFile() && f.name.toLowerCase().endsWith('.csv'))
    .map((f) => path.join(redundanciesDir, f.name))
    .filter((filePath) => {
      if (!csvMatchesSchema(filePath)) {
        console.warn(
          `⚠️  Skipping ${path.basename(filePath)}: headers do not match required schema`,
        )
        return false
      }
      return true
    })
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))

  let filesToProcess = csvFiles
  if (fileFilter) {
    filesToProcess = csvFiles.filter((p) => path.basename(p) === fileFilter)
    if (filesToProcess.length === 0) {
      console.warn(`\n⚠️  No file matching "${fileFilter}" in ${redundanciesDir}`)
      console.warn('   Available:', csvFiles.map((p) => path.basename(p)).join(', '))
      process.exit(1)
    }
    console.log(`\n📁 Filtering to file: ${fileFilter}`)
  }

  console.log(`\n📁 Found ${filesToProcess.length} CSV file(s) to process`)
  if (filesToProcess.length === 0) {
    console.log('  No files to process.')
    process.exit(0)
  }
  if (maxImports !== undefined) {
    console.log(`  Max redundancies to import: ${maxImports}`)
  }

  const totalStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    companiesMatched: 0,
    companiesCreated: 0,
  }

  /** Cache company name → company id across all files for consistent reuse */
  const companyCache: CompanyIdCache = new Map()

  /** Cache location string → Country across all files to avoid repeated geocoding API calls */
  const geocodeCache: GeocodeCache = new Map()

  for (const filePath of filesToProcess) {
    if (maxImports !== undefined && totalStats.created + totalStats.updated >= maxImports) {
      console.log(`\n⏹️  Reached max import limit (${maxImports}) across all files, stopping.`)
      break
    }

    console.log(`\n${'='.repeat(80)}`)
    console.log(`Checking file: ${filePath}`)
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`)
      console.warn(`   Please ensure the file exists at this path`)
      continue
    }

    const maxRemaining =
      maxImports !== undefined ? maxImports - (totalStats.created + totalStats.updated) : undefined
    console.log(`✓ File exists, proceeding with processing...`)
    const stats = await processRedundancies(
      filePath,
      payload,
      companyCache,
      geocodeCache,
      dryRun,
      maxRemaining,
    )

    console.log(`\n📈 File processing complete:`)
    console.log(`  Created: ${stats.created}`)
    console.log(`  Updated: ${stats.updated}`)
    console.log(`  Skipped: ${stats.skipped}`)
    console.log(`  Errors: ${stats.errors}`)

    totalStats.created += stats.created
    totalStats.updated += stats.updated
    totalStats.skipped += stats.skipped
    totalStats.errors += stats.errors
    totalStats.companiesMatched += stats.companiesMatched
    totalStats.companiesCreated += stats.companiesCreated
  }

  console.log('\n✅ Ingestion complete!')
  if (dryRun) {
    console.log('  (dry-run – no data was written)')
  }
  console.log('\n📊 Total Statistics:')
  console.log(`  Created: ${totalStats.created}`)
  console.log(`  Updated: ${totalStats.updated}`)
  console.log(`  Skipped: ${totalStats.skipped}`)
  console.log(`  Errors: ${totalStats.errors}`)
  console.log(`  Companies matched: ${totalStats.companiesMatched}`)
  console.log(`  Companies created: ${totalStats.companiesCreated}`)

  process.exit(0)
}

// CLI
const program = new Command()
program
  .name('ingest-redundancies')
  .description('Ingest redundancy CSVs from public/redundancies and create Payload Actions')
  .option(
    '--dry-run',
    'Report what would be done without saving to Payload (for debugging company matching and parent/child)',
  )
  .option('--file <filename>', 'Process only this CSV file (e.g. "2023 Grid View Breakdown.csv")')
  .option(
    '--max <number>',
    'Stop after this many redundancies have been created or updated (across all files)',
    (v) => parseInt(v, 10),
  )
  .action((opts) => {
    run({
      dryRun: !!opts.dryRun,
      file: opts.file,
      max: opts.max != null && !Number.isNaN(opts.max) ? opts.max : undefined,
    }).catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
  })

program.parse()
