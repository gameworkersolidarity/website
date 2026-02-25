'use client'

import type { Action } from '@/payload-types'
import { motion } from 'motion/react'
import { ActionBreadcrumbNavLink } from '@/app/(frontend)/actions/[slug]/ActionPage'
import { layoutTransition } from '@/lib/motion'

const SIDEBAR_LIMIT = 3

export function ArticleActionsSidebar({
  side,
  actions,
  articleDate,
  limit = SIDEBAR_LIMIT,
}: {
  side: 'previous' | 'next'
  actions: Action[]
  articleDate: string
  limit?: number
}) {
  const list = actions.slice(0, limit)
  if (list.length === 0) return <aside></aside>

  const isPrevious = side === 'previous'
  return (
    <aside
      className={
        isPrevious
          ? 'order-1 lg:order-0 text-right lg:flex flex-col gap-3 items-start rtl'
          : 'text-left flex flex-col gap-3 order-3'
      }
    >
      <div className="text-sm text-zinc-500 font-semibold mb-2 mx-3">
        {isPrevious ? 'Before this article' : 'After this article'}
      </div>
      <motion.div className="flex flex-col gap-3" layout transition={layoutTransition}>
        {list.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...layoutTransition, delay: index * 0.04 }}
          >
            <ActionBreadcrumbNavLink
              direction={isPrevious ? 'previous' : 'next'}
              action={action}
              label="countries"
              currentActionDate={articleDate}
            />
          </motion.div>
        ))}
      </motion.div>
    </aside>
  )
}
