'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import type { Campaign, Action, Media } from '@/payload-types'
import { notFound } from 'next/navigation'
import { AdminEditBanner } from '@/components/Me'
import { projectStrings } from '@/project-strings'
import Image from 'next/image'
import { ActionExplorer } from '../../components/ActionExplorer'
import { ZoomLevel } from '@/utils/global-state'
import { ActionInitiatorFilter } from '@/collections/enums'
import pluralize from 'pluralize'
import Link from 'next/link'
import { ArrowDownIcon } from 'lucide-react'
import { useMemo } from 'react'
import { format, isSameMonth, isSameYear } from 'date-fns'
import { getMediaUrl } from '@/utils/media'
import { DraftBadge } from '@/components/DraftBadge'
import { DataPageFooter } from '@/components/DataPageFooter'

const Back = ({ className }: { className?: string }) => (
  <div className={className}>
    <Link
      href="/campaigns"
      className="mb-2 rounded-md px-2 py-1 bg-background/80 hover:bg-snot-400/80 transition-colors duration-300 inline-flex items-center gap-1 w-auto"
    >
      &larr; All campaigns
    </Link>
  </div>
)

export function CampaignPage({ initialCampaign }: { initialCampaign: Campaign }) {
  if (!initialCampaign) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const { data: page } = useLivePreview({
    initialData: initialCampaign,
    serverURL: projectStrings.baseUrl,
    depth: 3,
  })

  const actions = page.actions as Action[]
  const featuredMedia =
    page.featuredImage && typeof page.featuredImage === 'object'
      ? (page.featuredImage as Media)
      : null
  const featuredImageUrl = getMediaUrl(featuredMedia)

  const earliestAction = useMemo(() => {
    if (!actions) return null
    return actions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  }, [actions])

  const latestAction = useMemo(() => {
    if (!actions) return null
    return actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }, [actions])

  const sameYear = useMemo(() => {
    if (!earliestAction || !latestAction) return false
    return isSameYear(earliestAction.date, latestAction.date)
  }, [earliestAction, latestAction])

  const sameMonth = useMemo(() => {
    if (!earliestAction || !latestAction) return false
    return isSameMonth(earliestAction.date, latestAction.date)
  }, [earliestAction, latestAction])

  return (
    <div>
      <AdminEditBanner page={page} />
      {featuredImageUrl ? (
        <div className="relative">
          <Image
            src={featuredImageUrl}
            alt={page.name}
            width={featuredMedia?.width || 1000}
            height={featuredMedia?.height || 1000}
            className="w-full h-auto object-cover z-10 max-h-[66vh]"
          />
          <article className="absolute top-0 left-0 w-full">
            <div className="max-w-5xl mx-auto md:p-5 flex flex-col gap-4 z-20">
              <Back />
            </div>
          </article>
          <article className="max-w-5xl mx-auto md:p-5 flex flex-col gap-4 -mt-8 z-20 relative">
            <section className="bg-white rounded-xl p-4 md:p-6 space-y-4">
              <header>
                <div className="font-mono uppercase text-sm opacity-50 text-center flex items-center justify-center gap-2">
                  <span>Campaign</span>
                  {page._status === 'draft' && <DraftBadge />}
                </div>
                <div className="font-mono uppercase text-sm opacity-50 text-center">
                  {!!earliestAction && !!latestAction && (
                    <span>
                      {format(
                        earliestAction.date,
                        sameMonth ? 'dd' : sameYear ? 'dd MMM' : 'dd MMM yyyy',
                      )}{' '}
                      &rarr; {format(latestAction.date, 'dd MMM yyyy')}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-identity text-center">
                  {page.name}
                </h1>
                {/* Count of actions */}
                <div
                  className="mt-4 opacity-50 hover:opacity-100 transition-opacity duration-300 text-center cursor-pointer flex items-center justify-center gap-1 font-mono text-sm uppercase"
                  onClick={() => {
                    const actionsElement = document.getElementById('actions')
                    if (actionsElement) {
                      actionsElement.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  <span>{pluralize('action', actions?.length || 0, true)}</span>
                  <ArrowDownIcon className="w-4 h-4 inline-block" />
                </div>
              </header>
              {page.description && (
                <LexicalRenderer content={page.description} className="mt-4 mx-auto" />
              )}
            </section>
          </article>
        </div>
      ) : (
        <article className="max-w-5xl mx-auto md:p-5 flex flex-col gap-4">
          <Back />
          <section className="bg-white rounded-xl p-4 md:p-6 space-y-4">
            <header>
              <div className="font-mono uppercase text-sm opacity-50 flex items-center gap-2">
                <span>Campaign</span>
                {page._status === 'draft' && <DraftBadge />}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold font-identity">{page.name}</h1>
            </header>
            {page.description && <LexicalRenderer content={page.description} />}
          </section>
        </article>
      )}

      <div className="bg-background relative" id="actions">
        <ActionExplorer
          graphs={false}
          overrideDefaultZoomLevel={ZoomLevel.Timeline}
          actionFilterContextProps={{
            overrideFilteredInitiator: ActionInitiatorFilter.ALL,
          }}
          actions={actions}
          linkStyle="hard"
          timelineBy={page.highlightedActionAttribute || 'categories'}
          actionFilterProps={{
            campaigns: false,
            years: false,
            initiators: false,
          }}
        />
      </div>
      <DataPageFooter collection="campaigns" id={page.id} />
    </div>
  )
}
