'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { EventCard } from '@/components/EventCard'
import type { Event } from '@/payload-types'
import { LoggedIn, Username } from '@/components/Me'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import { projectStrings } from '@/project-strings'

export function EventPage({ initialEvent }: { initialEvent: Event }) {
  if (!initialEvent) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const { data: event } = useLivePreview({
    initialData: initialEvent,
    serverURL: projectStrings.baseUrl,
    depth: 2,
  })

  return (
    <div className="bg-gwBackground" style={{ minHeight: '66vh' }}>
      <LoggedIn>
        <div className="flex flex-row items-center justify-between gap-4 bg-snot-300 p-4 text-black font-mono text-sm uppercase">
          <Link href={`/admin/collections/events/${event.id}`}>
            <Button>Edit this page</Button>
          </Link>
          <div>
            Logged in as <Username />
          </div>
        </div>
      </LoggedIn>
      <div className="max-w-4xl mx-auto py-5 px-4 flex flex-col gap-4">
        <EventCard data={event} withContext displayStandaloneInfo />
      </div>
    </div>
  )
}
