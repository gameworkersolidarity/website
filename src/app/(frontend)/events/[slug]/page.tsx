'use server'

import { GetStaticPaths } from 'next'
import { EventCard } from '@/components/EventCard'
import { Event } from '@/payload-types'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import { LoggedIn, Username } from '@/components/Me'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type PageProps = { event?: Event | null | undefined }
type PageParams = { slug: string }

export async function ClientPage({ event }: PageProps) {
  if (!event) notFound()

  return (
    <div className="bg-gwBackground" style={{ minHeight: '66vh' }}>
      <div className="max-w-4xl mx-auto py-5 px-4 flex flex-col gap-4">
        <LoggedIn>
          <div className="flex flex-row items-center justify-between gap-4 bg-snot-300 p-4 rounded-lg">
            <div>
              Logged in as <Username />
            </div>
            <Link href={`/admin/collections/events/${event.id}`}>
              <Button>Edit this page</Button>
            </Link>
          </div>
        </LoggedIn>
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
