import { NextRequest, NextResponse } from 'next/server'
import { payloadUserQuery } from '@/utils/payload.server'
import { projectStrings } from '@/project-strings'
import { ActionInitiator } from '@/collections/enums'
import type { Payload } from 'payload'
import { Action } from '@/payload-types'

/**
 * GET /api/actions/random
 * Redirects to a random action page (Wikipedia-style "Random article").
 */

export async function GET(request: NextRequest) {
  const base = projectStrings.baseUrl
  try {
    const queryConfig: Parameters<Payload['find']>[0] = {
      collection: 'actions',
      limit: 1,
      pagination: true,
      select: { slug: true },
      where: { and: [{ initiator: { equals: ActionInitiator.WORKER_LED } }] },
      sort: '-date',
    }

    const { totalDocs, docs } = await payloadUserQuery(queryConfig)

    if (totalDocs === 0 || !(docs[0] as Action)?.slug) {
      return NextResponse.redirect(new URL('/', base), 302)
    }

    const randomIntInTotalDocRange = Math.floor(Math.random() * totalDocs) + 1
    const randomResult = await payloadUserQuery({
      ...queryConfig,
      page: randomIntInTotalDocRange,
    })

    const action = randomResult.docs[0]
    if (!(action as Action)?.slug) {
      return NextResponse.redirect(new URL('/', base), 302)
    }

    return NextResponse.redirect(new URL(`/actions/${(action as Action).slug}`, base), 302)
  } catch (error) {
    console.error('Error fetching random action:', error)
    return NextResponse.redirect(new URL('/', base), 302)
  }
}
