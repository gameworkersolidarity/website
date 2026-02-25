'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { motion } from 'motion/react'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { OrganisingGroupCard } from '@/components/OrganisingGroupCard'
import { CountryLabel } from '@/components/CountryLabel'
import { projectStrings } from '@/project-strings'
import { layoutTransition } from '@/lib/motion'
import type { StartOrganising, OrganisingGroup, Country } from '@/payload-types'
import { AdminEditBanner } from '@/components/Me'

export function StartOrganisingPageClient({
  initialData,
  groupsByCountry,
}: {
  initialData: StartOrganising
  groupsByCountry: Array<{ country: Country; groups: OrganisingGroup[] }>
}) {
  const { data: page } = useLivePreview({
    initialData,
    serverURL: projectStrings.baseUrl,
    depth: 2,
  })

  return (
    <>
      <AdminEditBanner page={{ adminPath: '/admin/globals/startOrganising', id: page.id }} />
      <div className="mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 md:gap-6 lg:gap-8">
          <h1 className="text-4xl lg:text-5xl font-bold font-identity mb-4">Start organising!</h1>
          <LexicalRenderer content={page.description} />
        </div>

        {groupsByCountry.length > 0 && (
          <motion.div className="grid grid-cols-1 gap-4" layout transition={layoutTransition}>
            {groupsByCountry.map(({ country, groups }) => (
              <motion.div
                key={country.id}
                className="grid gap-4"
                layout
                transition={layoutTransition}
              >
                <header>
                  <h2 className="text-2xl">
                    <CountryLabel country={country} link />
                  </h2>
                </header>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  layout
                  transition={layoutTransition}
                >
                  {groups.map((group) => (
                    <motion.div key={group.id} layout transition={layoutTransition}>
                      <OrganisingGroupCard group={group} />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  )
}
