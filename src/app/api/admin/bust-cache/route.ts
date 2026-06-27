import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidateTag } from 'next/cache'
import { getAllCacheTags } from '@/lib/cache'

/**
 * Admin-only cache bust: revalidates all cache tags. Requires authenticated Payload user (admin session).
 * Used by the dashboard "Bust cache" widget. Tags come from the cache registry.
 */
export async function POST(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const authStatus = await payload.auth({
      headers: request.headers,
      canSetHeaders: false,
    })

    if (!authStatus.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allTags = getAllCacheTags()
    for (const tag of allTags) {
      revalidateTag(tag, 'max')
    }

    return NextResponse.json({
      ok: true,
      revalidated: allTags,
      now: Date.now(),
    })
  } catch (e) {
    console.error('Bust cache error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to bust cache' },
      { status: 500 },
    )
  }
}
