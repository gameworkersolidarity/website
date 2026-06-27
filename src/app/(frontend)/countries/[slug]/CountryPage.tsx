'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { motion } from 'motion/react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import type { Company, Country, Action, OrganisingGroup } from '@/payload-types'
import { notFound } from 'next/navigation'
import { AdminEditBanner } from '@/components/Me'
import chroma from 'chroma-js'
import { twMerge } from 'tailwind-merge'
import { projectStrings } from '@/project-strings'
import { CountryLabel } from '@/components/CountryLabel'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'
import { CompanyLabel } from '@/components/CompanyLabel'
import { DraftBadge } from '@/components/DraftBadge'
import { ActionExplorer } from '../../components/ActionExplorer'
import { ZoomLevel } from '@/utils/global-state'
import { ActionInitiatorFilter } from '@/collections/enums'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CollapsibleList, CollapsibleTriggerIcon } from '@/components/CollapsibleList'
import pluralize from 'pluralize'
import { DataPageFooter } from '@/components/DataPageFooter'
import { layoutTransition } from '@/lib/motion'

export function CountryPage({
  initialCountry,
  actions,
  companies,
  organisingGroups,
}: {
  initialCountry: Country
  actions: Action[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
}) {
  if (!initialCountry) notFound()

  // Use the Payload API URL (where the admin panel is hosted)

  const { data: page } = useLivePreview({
    initialData: initialCountry,
    serverURL: projectStrings.baseUrl,
    depth: 2,
  })

  const primaryColor = '#EEE'
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
          'max-w-4xl mx-auto pb-4 md:py-5 px-4 flex flex-col gap-4',
          textColor === 'white' && 'text-white',
        )}
      >
        <header className="sticky top-6 z-20" style={{ backgroundColor: primaryColor }}>
          <div className="font-mono uppercase text-sm opacity-50 flex items-center gap-2">
            <span>Country</span>
            {page._status === 'draft' && <DraftBadge />}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-identity">
            <CountryLabel country={page} />
          </h1>
        </header>
        {page.description && (
          <LexicalRenderer
            content={page.description}
            className={twMerge(textColor === 'white' && 'prose-invert')}
          />
        )}
        {organisingGroups.length > 0 && (
          <CollapsibleList defaultOpen={organisingGroups.length < 15}>
            <CollapsibleTrigger className="flex flex-row items-center gap-1 cursor-pointer">
              <h2 className="text-xl font-bold font-identity">
                {pluralize('worker organising group', organisingGroups.length, true)}
              </h2>
              <CollapsibleTriggerIcon className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="text-sm opacity-50">Worker organising groups within {page.name}.</p>
              <motion.div
                className="flex flex-row flex-wrap gap-2 mt-2"
                layout
                transition={layoutTransition}
              >
                {organisingGroups.map((organisingGroup) => (
                  <motion.div key={organisingGroup.id} layout transition={layoutTransition}>
                    <OrganisingGroupLabel organisingGroup={organisingGroup} link />
                  </motion.div>
                ))}
              </motion.div>
            </CollapsibleContent>
          </CollapsibleList>
        )}
        {companies.length > 0 && (
          <CollapsibleList defaultOpen={companies.length < 15}>
            <CollapsibleTrigger className="flex flex-row items-center gap-1 cursor-pointer">
              <h2 className="text-xl font-bold font-identity">
                {pluralize('company', companies.length, true)}
              </h2>
              <CollapsibleTriggerIcon className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="text-sm opacity-50">Companies operating in {page.name}.</p>
              <motion.div
                className="flex flex-row flex-wrap gap-2 mt-2"
                layout
                transition={layoutTransition}
              >
                {companies.map((company) => (
                  <motion.div key={company.id} layout transition={layoutTransition}>
                    <CompanyLabel company={company as Company} link />
                  </motion.div>
                ))}
              </motion.div>
            </CollapsibleContent>
          </CollapsibleList>
        )}
      </article>

      <ActionExplorer
        showFilter
        overrideDefaultZoomLevel={ZoomLevel.Timeline}
        actionFilterContextProps={{
          overrideFilteredCountryISOA2: page.isoA2,
          overrideFilteredInitiator: ActionInitiatorFilter.ALL,
        }}
        actions={actions}
        primaryColor={primaryColor}
        linkStyle="hard"
        timelineBy="categories"
        actionFilterProps={{
          countries: false,
          years: false,
          campaigns: false,
          initiators: false,
        }}
      />
      <DataPageFooter collection="countries" id={page.id} />
    </div>
  )
}
