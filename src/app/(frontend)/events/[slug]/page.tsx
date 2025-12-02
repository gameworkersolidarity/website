'use server'

import { GetStaticPaths } from 'next'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import { EventPage } from './EventPage'

type PageParams = { slug: string }

export const getStaticPaths: GetStaticPaths<PageParams> = async (context) => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const events = await payload.find({
    collection: 'events',
    depth: 0,
    sort: 'date:desc',
  })

  return {
    paths: events.docs.map((event) => ({
      params: {
        ...event,
      },
    })),
    fallback: true,
  }
}

export default async function ServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const events = await payload.find({
    collection: 'events',
    sort: 'date:desc',
    depth: 2,
    draft: isDraftMode,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  if (!events.docs.length) notFound()

  return <EventPage initialEvent={events.docs[0]} />
}
