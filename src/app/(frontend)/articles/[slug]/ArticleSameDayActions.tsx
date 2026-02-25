'use client'

import type { Action } from '@/payload-types'
import { motion } from 'motion/react'
import { ActionBreadcrumbNavLink } from '@/app/(frontend)/actions/[slug]/ActionPage'
import { layoutTransition } from '@/lib/motion'

export function ArticleSameDayActions({
  sameDayActions,
  articleDate,
}: {
  sameDayActions: Action[]
  articleDate: string
}) {
  if (sameDayActions.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mt-4">
      <h3 className="text-sm text-zinc-500 font-semibold mb-2">Also on this day</h3>
      <motion.div
        className="-mx-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 items-start"
        layout
        transition={layoutTransition}
      >
        {sameDayActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...layoutTransition, delay: index * 0.04 }}
          >
            <ActionBreadcrumbNavLink
              direction="sameDay"
              action={action}
              label="countries"
              currentActionDate={articleDate}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
