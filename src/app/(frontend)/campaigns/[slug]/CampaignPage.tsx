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
import { ArrowLeftIcon } from 'lucide-react'
import { useMemo } from 'react'
import { format, isSameMonth, isSameYear } from 'date-fns'
import { getMediaUrl } from '@/utils/media'
import { DraftBadge } from '@/components/DraftBadge'
import { DataPageFooter } from '@/components/DataPageFooter'
import { validatePayloadDocument, validatePayloadDocuments } from '@/utils/validate-payload'
import { Button } from '@/components/ui/button'

const Back = ({ className }: { className?: string }) => (
  <div className={className}>
    <Link href="/campaigns">
      <Button variant="outline" className="opacity-70 hover:opacity-100 transition-opacity">
        <ArrowLeftIcon className="w-4 h-4" />
        All campaigns
      </Button>
    </Link>
  </div>
)

export function CampaignPage({ initialCampaign }: { initialCampaign: Campaign }) {
  if (!initialCampaign) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const { data: pageData } = useLivePreview({
    initialData: initialCampaign,
    serverURL: projectStrings.baseUrl,
    depth: 3,
  })

  const page = validatePayloadDocument('campaigns', pageData)

  const actions = useMemo(() => {
    if (!page.actions) return []
    return validatePayloadDocuments('actions', page.actions)
  }, [page.actions])

  const featuredMedia =
    page.featuredImage && typeof page.featuredImage === 'object'
      ? (page.featuredImage as Media)
      : null
  const featuredImageUrl = getMediaUrl(featuredMedia)

  const earliestAction = useMemo(() => {
    if (!actions || actions.length === 0) return null
    return actions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  }, [actions])

  const latestAction = useMemo(() => {
    if (!actions || actions.length === 0) return null
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
      <article className="max-w-5xl mx-auto md:p-5 flex flex-col gap-4">
        <Back />
        <section className="bg-white rounded-xl p-4 md:p-6 space-y-4">
          <header>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm uppercase opacity-50">
              <span className="flex items-center gap-2">
                Campaign
                {page._status === 'draft' && <DraftBadge />}
              </span>
              {!!earliestAction && !!latestAction && (
                <>
                  <span aria-hidden className="opacity-40">
                    ·
                  </span>
                  <span>
                    {format(
                      earliestAction.date,
                      sameMonth ? 'dd' : sameYear ? 'dd MMM' : 'dd MMM yyyy',
                    )}{' '}
                    &rarr; {format(latestAction.date, 'dd MMM yyyy')}
                  </span>
                </>
              )}
              <span aria-hidden className="opacity-40">
                ·
              </span>
              <div
                className="cursor-pointer group opacity-100 w-fit"
                onClick={() => {
                  const actionsElement = document.getElementById('actions')
                  if (actionsElement) {
                    actionsElement.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
              >
                <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 font-mono text-sm uppercase text-gray-700 group-hover:bg-gray-300 transition-colors">
                  {pluralize('action', actions?.length || 0, true)}
                </span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-identity mt-2">{page.name}</h1>
          </header>
          {featuredImageUrl && (
            <Image
              src={featuredImageUrl}
              alt={page.name}
              width={featuredMedia?.width || 1000}
              height={featuredMedia?.height || 1000}
              objectFit="cover"
              className="w-full max-h-64 md:h-auto object-cover rounded-lg overflow-hidden"
            />
          )}
          {page.description && <LexicalRenderer content={page.description} className="mt-4" />}
        </section>
      </article>

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
