'use client'

import type { Action } from '@/payload-types'
import { ActionBreadcrumbNavLink } from '@/app/(frontend)/actions/[slug]/ActionPage'

const SIDEBAR_LIMIT = 3

export function ArticleActionsSidebar({
  side,
  actions,
  articleDate,
}: {
  side: 'previous' | 'next'
  actions: Action[]
  articleDate: string
}) {
  const list = actions.slice(0, SIDEBAR_LIMIT)
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
      {list.map((action) => (
        <ActionBreadcrumbNavLink
          key={action.id}
          direction={isPrevious ? 'previous' : 'next'}
          action={action}
          label="countries"
          currentActionDate={articleDate}
        />
      ))}
    </aside>
  )
}
