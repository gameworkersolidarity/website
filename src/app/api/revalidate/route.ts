import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getAllCacheTags } from '@/lib/cache'

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

/**
 * On-demand revalidation for cached index/homepage data.
 * Call from Payload webhooks or cron after content changes.
 * Tags come from the cache registry; if no tag/tags in body, revalidates all.
 *
 *   POST /api/revalidate
 *   Body: { "secret": "<REVALIDATE_SECRET>", "tag": "homepage" }
 *   or    { "secret": "<REVALIDATE_SECRET>", "tags": ["homepage", "countries-index"] }
 */
export async function POST(request: NextRequest) {
  if (!REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'REVALIDATE_SECRET not configured' }, { status: 501 })
  }

  try {
    const body = await request.json()
    const { secret, tag, tags } = body || {}

    if (secret !== REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    const toRevalidate = tag ? [tag] : Array.isArray(tags) ? tags : getAllCacheTags()

    for (const t of toRevalidate) {
      if (typeof t === 'string' && t.length > 0) {
        revalidateTag(t, 'max')
      }
    }

    return NextResponse.json({
      revalidated: toRevalidate,
      now: Date.now(),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Bad request' },
      { status: 400 },
    )
  }
}
