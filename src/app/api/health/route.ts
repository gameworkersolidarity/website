import { NextResponse } from 'next/server'

/**
 * Dedicated health check endpoint for load balancers / orchestrators.
 * Returns a simple JSON response with no streaming so health checks don't
 * trigger "controller[kState].transformAlgorithm is not a function" when
 * the client closes the connection early on streaming pages (e.g. /).
 *
 * @see https://github.com/vercel/next.js/discussions/75995
 */
export async function GET() {
  return NextResponse.json(
    { status: 'ok' },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
}

export const dynamic = 'force-static'
