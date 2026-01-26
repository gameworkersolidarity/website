import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { slugify } from 'payload/shared'

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

export async function POST(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const data = await request.json()

    // Ensure the action is saved as a draft
    const actionData = {
      ...data,
      slug: `${getYearMonth(data.date)}-${slugify(data.name)}`,
      _status: 'draft' as const,
    }

    // Create the action
    const action = await payload.create({
      collection: 'actions',
      data: actionData,
      draft: true,
    })

    return NextResponse.json(
      {
        success: true,
        id: action.id,
        message: 'Action submitted successfully',
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error('Error submitting action:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to submit action',
        errors: error.errors || [],
      },
      { status: 400 },
    )
  }
}
