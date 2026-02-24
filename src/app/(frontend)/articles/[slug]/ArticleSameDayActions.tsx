'use client'

import type { Action } from '@/payload-types'
import { ActionBreadcrumbNavLink } from '@/app/(frontend)/actions/[slug]/ActionPage'

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
      <div className="-mx-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 items-start">
        {sameDayActions.map((action) => (
          <ActionBreadcrumbNavLink
            direction="sameDay"
            action={action}
            key={action.id}
            label="countries"
            currentActionDate={articleDate}
          />
        ))}
      </div>
    </div>
  )
}
