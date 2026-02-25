import { NextRequest, NextResponse } from 'next/server'
import { payloadUserQuery } from '@/utils/payload.server'
import { projectStrings } from '@/project-strings'

/**
 * GET /api/actions/random
 * Redirects to a random action page (Wikipedia-style "Random article").
 */
export async function GET(request: NextRequest) {
  const base = projectStrings.baseUrl
  try {
    const { totalDocs, docs } = await payloadUserQuery({
      collection: 'actions',
      limit: 1,
      pagination: true,
      select: { slug: true },
      sort: '-date',
    })

    if (totalDocs === 0 || !docs[0]?.slug) {
      return NextResponse.redirect(new URL('/actions', base), 302)
    }

    const randomIntInTotalDocRange = Math.floor(Math.random() * totalDocs) + 1
    const randomResult = await payloadUserQuery({
      collection: 'actions',
      limit: 1,
      page: randomIntInTotalDocRange,
      select: { slug: true },
      sort: '-date',
    })

    const action = randomResult.docs[0]
    if (!action?.slug) {
      return NextResponse.redirect(new URL('/actions', base), 302)
    }

    return NextResponse.redirect(new URL(`/actions/${action.slug}`, base), 302)
  } catch (error) {
    console.error('Error fetching random action:', error)
    return NextResponse.redirect(new URL('/', base), 302)
  }
}
