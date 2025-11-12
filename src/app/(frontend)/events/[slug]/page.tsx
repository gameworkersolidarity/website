import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import { EventContent } from './EventContent'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const event = await payload
    .find({
      collection: 'events',
      depth: 2, // Include related data (related events, etc.)
      draft: isDraftMode,
      limit: 1,
      where: {
        slug: {
          equals: slug,
        },
        // Only fetch published content when not in draft mode
        ...(!isDraftMode
          ? {
              _status: {
                equals: 'published',
              },
            }
          : {}),
      },
    })
    .then(({ docs }) => docs?.[0])

  if (!event) {
    notFound()
  }

  return <EventContent initialEvent={event} isDraftMode={isDraftMode} />
}

