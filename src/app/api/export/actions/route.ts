import { NextRequest, NextResponse } from 'next/server'
import { payloadUserQuery } from '@/utils/payload.server'
import { projectStrings } from '@/project-strings'
import { ActionInitiator } from '@/collections/enums'
import config from '@payload-config'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { Action } from '@/payload-types'
import { base } from 'airtable'
import { draftMode, headers as nextHeaders } from 'next/headers'

/**
 * GET /api/actions/random
 * Redirects to a random action page (Wikipedia-style "Random article").
 */

export async function GET(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    // // query and send export request to payload
    // const exportRequest = await payload.create({
    //   collection: 'exports',
    //   draft: true,
    //   data: {
    //     collectionSlug: 'actions',
    //     format: 'csv',
    //     // limit: 1000,
    //     // page: 1,
    //     sort: 'date',
    //     sortOrder: 'desc',
    //   },
    // })
    const headers = await nextHeaders()
    const exportRequest = await fetch('http://localhost:3000/api/exports/download', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          collectionSlug: 'actions',
          format: 'csv',
          sort: 'date',
          sortOrder: 'desc',
        },
      }),
    })

    // Stream the response back to the client
    return new NextResponse(exportRequest.body, {
      status: exportRequest.status,
      headers: {
        'Content-Type': exportRequest.headers.get('Content-Type') || 'application/octet-stream',
        // You might want to forward other relevant headers as needed
      },
    })
    const exportRequestData = await exportRequest.json()
    return NextResponse.json({ success: true, exportRequestData })
  } catch (error) {
    console.error('Error fetching random action:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
