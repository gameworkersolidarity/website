'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton for static content pages (about, data, submit, start-organising, [slug])
 * that follow a title + body layout. Mirrors the content-wrapper and typography
 * of those pages rather than the homepage layout.
 */
export function StaticPageSkeleton() {
  return (
    <article className="content-wrapper p-4 md:p-6 lg:p-8 space-y-6">
      <header className="space-y-4">
        <Skeleton className="h-10 w-72 max-w-3xl rounded-md" />
      </header>
      <div className="space-y-3 max-w-3xl">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
      </div>
    </article>
  )
}
