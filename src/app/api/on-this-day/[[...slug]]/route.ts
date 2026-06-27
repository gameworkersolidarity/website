import { NextRequest, NextResponse } from 'next/server'
import { payloadUserQuery } from '@/utils/payload.server'
import { validatePayloadResult } from '@/utils/validate-payload'

/**
 * Builds the same calendar date (month + day) for a range of years.
 * Used to query "on this day" events: everything that happened on this day in any year.
 */
function getAnniversaryDates(
  month: number,
  day: number,
  fromYear: number,
  toYear: number,
): string[] {
  const dates: string[] = []
  const monthStr = String(month).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')
  for (let year = fromYear; year <= toYear; year++) {
    // Validate the date exists (e.g. Feb 30 doesn't)
    const d = new Date(year, month - 1, day)
    if (d.getMonth() === month - 1 && d.getDate() === day) {
      dates.push(`${year}-${monthStr}-${dayStr}`)
    }
  }
  return dates
}

/**
 * Parse month-day from a slug like "02-24" or "2-24". Returns null if invalid.
 */
function parseMonthDay(slug: string | undefined): { month: number; day: number } | null {
  if (!slug || !slug.trim()) return null
  const parts = slug.trim().split('-')
  if (parts.length !== 2) return null
  const month = parseInt(parts[0], 10)
  const day = parseInt(parts[1], 10)
  if (Number.isNaN(month) || Number.isNaN(day)) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  // Check it's a real calendar date
  const d = new Date(2000, month - 1, day)
  if (d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return { month, day }
}

/**
 * GET /api/on-this-day
 * GET /api/on-this-day/[month-day]
 * Returns actions that occurred on the given calendar date (month + day) in any year.
 * Without a slug, uses today's date. With a slug (e.g. 02-24), uses that month and day.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params
    const dateSlug = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined
    const parsed = parseMonthDay(dateSlug)

    let month: number
    let day: number
    if (parsed) {
      month = parsed.month
      day = parsed.day
    } else {
      if (dateSlug !== undefined) {
        return NextResponse.json(
          { error: 'Invalid date slug. Use month-day, e.g. 02-24 or 12-1', actions: [] },
          { status: 400 },
        )
      }
      const now = new Date()
      month = now.getUTCMonth() + 1
      day = now.getUTCDate()
    }

    const currentYear = new Date().getUTCFullYear()
    const fromYear = 1900
    const toYear = currentYear

    const anniversaryDates = getAnniversaryDates(month, day, fromYear, toYear)
    if (anniversaryDates.length === 0) {
      return NextResponse.json({ actions: [], totalDocs: 0, date: { month, day } })
    }

    const result = await payloadUserQuery({
      collection: 'actions',
      where: {
        or: anniversaryDates.map((date) => ({
          date: { equals: date },
        })),
      },
      depth: 2,
      sort: '-date',
      limit: 500,
      pagination: false,
    }).then((res) => validatePayloadResult('actions', res, false))

    return NextResponse.json({
      actions: result.docs,
      totalDocs: result.totalDocs,
      date: { month, day },
    })
  } catch (error: unknown) {
    console.error('Error fetching on-this-day:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch on-this-day',
        actions: [],
      },
      { status: 500 },
    )
  }
}
