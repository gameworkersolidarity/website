import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { slugify } from 'payload/shared'
import { getPostHogClient } from '@/lib/posthog-server'

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

    // Track server-side submission event
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: 'anonymous_submission',
      event: 'action_submission_created',
      properties: {
        action_id: action.id,
        action_name: data.name,
        action_date: data.date,
        initiator: data.initiator,
        has_categories: !!data.categories?.length,
        has_countries: !!data.countries?.length,
        has_companies: !!data.companies?.length,
        has_organising_groups: !!data.organisingGroups?.length,
        source: 'api',
      },
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

    // Track server-side submission failure
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: 'anonymous_submission',
      event: 'action_submission_failed_server',
      properties: {
        error_message: error.message || 'Unknown error',
        source: 'api',
      },
    })

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
