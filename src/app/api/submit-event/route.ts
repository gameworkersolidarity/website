import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const data = await request.json()

    // Ensure the event is saved as a draft
    const eventData = {
      ...data,
      _status: 'draft' as const,
    }

    // Create the event
    const event = await payload.create({
      collection: 'events',
      data: eventData,
      draft: true,
    })

    return NextResponse.json(
      {
        success: true,
        id: event.id,
        message: 'Event submitted successfully',
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error('Error submitting event:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to submit event',
        errors: error.errors || [],
      },
      { status: 400 },
    )
  }
}


