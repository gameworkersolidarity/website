'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import type { Category, Action } from '@/payload-types'
import { notFound } from 'next/navigation'
import { AdminEditBanner } from '@/components/Me'
import chroma from 'chroma-js'
import { twMerge } from 'tailwind-merge'
import { projectStrings } from '@/project-strings'
import { getSlug } from '@/utils/payloadPath'
import { ActionInitiatorFilter } from '@/collections/enums'
import { ActionExplorer } from '../../components/ActionExplorer'
import { ZoomLevel } from '@/utils/global-state'

export function CategoryPage({
  initialCategory,
  actions,
}: {
  initialCategory: Category
  actions: Action[]
}) {
  if (!initialCategory) notFound()

  // Use the Payload API URL (where the admin panel is hosted)

  const { data: page } = useLivePreview({
    initialData: initialCategory,
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
      <AdminEditBanner page={page} />
      <article
        className={twMerge(
          'max-w-4xl mx-auto py-5 px-4 flex flex-col gap-4',
          textColor === 'white' && 'text-white',
        )}
      >
        <header>
          <div className="font-mono uppercase text-sm opacity-50">Category</div>
          <h1 className="text-5xl font-bold font-identity capitalize">
            {page.emoji && <span style={{ marginRight: '0.5rem' }}>{page.emoji}</span>}
            {page.name}
          </h1>
        </header>
        {page.description && (
          <LexicalRenderer
            content={page.description}
            className={twMerge(textColor === 'white' && 'prose-invert')}
          />
        )}
      </article>

      <ActionExplorer
        showFilter
        overrideDefaultZoomLevel={ZoomLevel.Timeline}
        actionFilterContextProps={{
          overrideFilteredCategorySlug: getSlug('categories', page),
          overrideFilteredInitiator:
            getSlug('categories', page) === 'redundancy'
              ? ActionInitiatorFilter.BOSS_LED
              : ActionInitiatorFilter.WORKER_LED,
        }}
        actions={actions}
        primaryColor={primaryColor}
        linkStyle="hard"
        timelineBy="countries"
        actionFilterProps={{
          categories: false,
          years: false,
          campaigns: false,
          initiators: false,
        }}
      />
    </div>
  )
}
