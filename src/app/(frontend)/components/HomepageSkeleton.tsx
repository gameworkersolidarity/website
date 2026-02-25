'use client'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect, useMemo, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

/**
 * Skeleton layout that mirrors the homepage: left panel (map + charts), right panel (header, filter, action cards).
 * Used as the loading fallback for the homepage (see loading.tsx).
 */
export function HomepageSkeleton() {
  return (
    <div className="homepage">
      <ResizablePanelGroup direction="horizontal" className="w-full h-screen">
        <ResizablePanel defaultSize={40} className="hidden md:block">
          <div className="sticky top-6 h-[calc(100vh-60px)] m-4 flex flex-col gap-4">
            {/* Map area */}
            <Skeleton className="h-[min(40vh,320px)] w-full rounded-xl" />
            {/* Worker actions chart */}
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            {/* Redundancies chart */}
            <div className="space-y-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle className="hidden md:flex" />
        <ResizablePanel defaultSize={60}>
          <div className="flex flex-col gap-2 @container">
            {/* Header: count + view tabs */}
            <header className="mt-1 md:sticky top-6 bg-background pt-3 z-40">
              <div className="px-4 flex flex-col @xl:flex-row justify-between gap-2 @xl:gap-4 pb-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full @xl:w-80 rounded-lg" />
              </div>
              {/* Filter bar */}
              <div className="px-4 py-2 border-t border-b border-gray-200 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-9 w-24 rounded-md" />
                  <Skeleton className="h-9 w-28 rounded-md" />
                  <Skeleton className="h-9 w-20 rounded-md" />
                  <Skeleton className="h-9 w-32 rounded-md" />
                </div>
              </div>
            </header>
            {/* Action cards list */}
            <div className="flex flex-col gap-4 px-4 pb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <ActionCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

function ActionCardSkeleton() {
  return (
    <div className="rounded-xl bg-card p-4 space-y-3">
      <Skeleton className="h-4.5 w-3/4" />
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
