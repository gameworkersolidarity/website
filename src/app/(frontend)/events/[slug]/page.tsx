'use server'

import { GetStaticPaths } from 'next'
import { EventCard } from '@/components/EventCard'
import { Event } from '@/payload-types'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import { LoggedIn } from '@/components/Me'
import Link from 'next/link'

type PageProps = { event?: Event | null | undefined }
type PageParams = { slug: string }

export async function ClientPage({ event }: PageProps) {
  if (!event) notFound()

  return (
    <div className="bg-gwBackground" style={{ minHeight: '66vh' }}>
      <LoggedIn>
        <Link href={`/admin/collections/events/${event.id}`} className="opacity-50 text-sm link">
          Edit this page
        </Link>
      </LoggedIn>
      <div className="max-w-4xl mx-auto py-5 px-4">
        <EventCard data={event} withContext displayStandaloneInfo />
      </div>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths<PageParams> = async (context) => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const events = await payload.find({
    collection: 'events',
    depth: 0,
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

  return <ClientPage event={events.docs[0]} />
}
