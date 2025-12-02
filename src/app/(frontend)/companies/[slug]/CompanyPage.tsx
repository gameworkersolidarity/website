'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import type { Company, Event } from '@/payload-types'
import { notFound } from 'next/navigation'
import { LoggedIn, Username } from '@/components/Me'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import chroma from 'chroma-js'
import { twMerge } from 'tailwind-merge'
import { EventFilterContextProvider } from '@/components/EventFilterContextProvider'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { EventList } from '@/components/EventList'
import { CollectiveActionStats } from '../../components/CollectiveActionStats'
import { ArchiveBreadcrumb } from '@/utils/payloadTree'
import { Descendants } from '../../components/Descendants'
import { projectStrings } from '@/project-strings'
import { getSlug } from '@/utils/payloadPath'

export function CompanyPage({
  initialCompany,
  descendants,
  events,
}: {
  initialCompany: Company
  descendants: ArchiveBreadcrumb[] | null
  events: Event[]
}) {
  if (!initialCompany) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const { data: page } = useLivePreview({
    initialData: initialCompany,
    serverURL: projectStrings.baseUrl,
    depth: 2,
  })

  const primaryColor = page.color!
  const textColor = chroma.contrast(primaryColor, chroma('white')) > 4.5 ? 'white' : 'black'

  return (
    <div
      style={{
        backgroundColor: primaryColor,
      }}
    >
      <LoggedIn>
        <div className="flex flex-row items-center justify-between gap-4 bg-snot-300 p-4 text-black font-mono text-sm uppercase">
          <Link href={`/admin/collections/companies/${page.id}`}>
            <Button>Edit this page</Button>
          </Link>
          <div>
            Logged in as <Username />
          </div>
        </div>
      </LoggedIn>
      <article
        className={twMerge(
          'max-w-4xl mx-auto py-5 px-4 flex flex-col gap-4',
          textColor === 'white' && 'text-white',
        )}
      >
        <header>
          <div className="font-mono uppercase text-sm text-gray-500">Company</div>
          <h1 className="text-5xl font-bold font-identity">{page.name}</h1>
        </header>
        {page.description && (
          <div className={twMerge('prose', textColor === 'white' && 'prose-invert')}>
            <LexicalRenderer content={page.description} />
          </div>
        )}
        {!!descendants && descendants.length > 1 && <Descendants breadcrumbs={descendants} />}
      </article>

      <EventFilterContextProvider
        events={events}
        overrideFilteredCompanySlug={getSlug('companies', page)}
      >
        <ResizablePanelGroup direction="horizontal" className="w-full h-screen bg-background">
          <ResizablePanel defaultSize={40}>
            <div className="sticky top-6 h-[calc(100vh-60px)]">
              <CollectiveActionStats color={primaryColor} />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60}>
            <EventList />
          </ResizablePanel>
        </ResizablePanelGroup>
      </EventFilterContextProvider>
    </div>
  )
}
