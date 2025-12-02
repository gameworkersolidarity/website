'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import type { OrganisingGroup, Event, Company } from '@/payload-types'
import { notFound } from 'next/navigation'
import { LoggedIn, Username } from '@/components/Me'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import chroma from 'chroma-js'
import { twMerge } from 'tailwind-merge'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import { EventFilterContextProvider } from '@/components/EventFilterContextProvider'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { EventList } from '@/components/EventList'
import { CollectiveActionStats } from '../../components/CollectiveActionStats'
import { projectStrings } from '@/project-strings'

export function OrganisingGroupPage({
  initialGroup,
  events,
  companies,
}: {
  initialGroup: OrganisingGroup
  events: Event[]
  companies: Company[]
}) {
  if (!initialGroup) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const { data: page } = useLivePreview({
    initialData: initialGroup,
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
          <Link href={`/admin/collections/organisingGroups/${page.id}`}>
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
          <div className="font-mono uppercase text-sm text-gray-500">Organising Group</div>
          <h1 className="text-5xl font-bold font-identity">{page.fullName || page.name}</h1>
        </header>
        {page.name !== page.fullName && page.name && (
          <p
            className={twMerge(
              'text-base',
              textColor === 'white' ? 'text-white/80' : 'text-gray-600',
            )}
          >
            Also known as: {page.name}
          </p>
        )}
        {page.isUnion && (
          <p
            className={twMerge(
              'text-sm font-bold',
              textColor === 'white' ? 'text-white' : 'text-blue-500',
            )}
          >
            Union
          </p>
        )}
        {(page.website || page.twitter || page.bluesky) && (
          <div className="flex flex-wrap gap-4">
            {page.website && (
              <a
                href={page.website}
                target="_blank"
                rel="noopener noreferrer"
                className={twMerge(
                  textColor === 'white' ? 'text-white underline' : 'text-blue-500 underline',
                )}
              >
                Website
              </a>
            )}
            {page.twitter && (
              <a
                href={page.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className={twMerge(
                  textColor === 'white' ? 'text-white underline' : 'text-blue-500 underline',
                )}
              >
                Twitter
              </a>
            )}
            {page.bluesky && (
              <a
                href={page.bluesky}
                target="_blank"
                rel="noopener noreferrer"
                className={twMerge(
                  textColor === 'white' ? 'text-white underline' : 'text-blue-500 underline',
                )}
              >
                Bluesky
              </a>
            )}
          </div>
        )}
        {page.description && (
          <div className={twMerge('prose', textColor === 'white' && 'prose-invert')}>
            <LexicalRenderer content={page.description} />
          </div>
        )}
        {companies.length > 0 && (
          <div>
            <h2 className="text-xl font-bold font-identity">
              Companies this group organises workers within
            </h2>
            <div className="flex flex-col flex-wrap gap-4 mt-4">
              {companies.map((company) => (
                <Link key={company.id} href={`/companies/${company.slug}`}>
                  {company.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <EventFilterContextProvider events={events} overrideFilteredOrganisingGroupSlug={page.slug}>
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
