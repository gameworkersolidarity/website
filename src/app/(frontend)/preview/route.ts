import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET
  const token = searchParams.get('previewSecret')
  const path = searchParams.get('path')

  if (!previewSecret) {
    return new Response('Preview secret not configured', { status: 500 })
  }

  if (token !== previewSecret) {
    return new Response('Invalid preview token', { status: 401 })
  }

  if (!path) {
    return new Response('Path parameter is required', { status: 400 })
  }

  // Enable draft mode
  ;(await draftMode()).enable()

  // Redirect to the specified path
  redirect(path)
}
