'use client'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton for the action detail page: 3-column layout (prev | main card + histogram | next).
 */
export function ActionPageSkeleton() {
  return (
    <div className="bg-gwBackground flex-1 flex flex-col" style={{ minHeight: '66vh' }}>
      <div className="mx-auto py-4 md:py-5 px-4 grid grid-cols-2 lg:grid-cols-[1fr_6fr_1fr] gap-4 mb-auto">
        <aside className="order-1 lg:order-0 text-right hidden lg:flex flex-col gap-3 items-start">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-14 w-full max-w-[200px] rounded-md" />
          <Skeleton className="h-14 w-full max-w-[200px] rounded-md" />
        </aside>
        <main className="col-span-2 lg:col-span-1 flex flex-col gap-4">
          {/* Main action card - match ActionCard: bg-white rounded-xl, p-4 lg:px-8 */}
          <div className="bg-white rounded-xl">
            <div className="p-4 lg:px-8 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-8 w-[80%] max-w-3xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-24 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            </div>
          </div>
          <Skeleton className="h-10 w-36" />
        </main>
        <aside className="text-left hidden lg:flex flex-col gap-3 order-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 w-full max-w-[200px] rounded-md" />
          <Skeleton className="h-14 w-full max-w-[200px] rounded-md" />
        </aside>
      </div>
    </div>
  )
}

/**
 * Shared bottom section for data pages: map + action list (filter, tabs, cards).
 * Used by country, company, organising group, category pages.
 */
function ActionExplorerSkeleton() {
  return (
    <ResizablePanelGroup direction="horizontal" className="w-full min-h-[60vh] bg-background">
      <ResizablePanel defaultSize={40} className="hidden md:block">
        <div className="sticky top-6 h-[calc(100vh-60px)] m-4">
          <Skeleton className="h-full min-h-[300px] w-full rounded-xl" />
        </div>
      </ResizablePanel>
      <ResizableHandle className="hidden md:flex" />
      <ResizablePanel defaultSize={60}>
        <div className="flex flex-col gap-2 pt-3">
          <div className="px-4 flex flex-col @xl:flex-row justify-between gap-2 pb-2">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-10 w-full @xl:w-72 rounded-lg" />
          </div>
          <div className="px-4 py-2 border-t border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-16 rounded-md" />
            </div>
          </div>
          <div className="flex flex-col gap-4 px-4 pb-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

/**
 * Skeleton for country detail page: header, description, sections, then action explorer.
 */
export function CountryPageSkeleton() {
  return (
    <div className="bg-[#EEE]">
      <article className="max-w-4xl mx-auto pb-4 md:py-5 px-4 flex flex-col gap-4">
        <header className="sticky top-6 z-20 bg-[#EEE]">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-12 w-48" />
        </header>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </article>
      <ActionExplorerSkeleton />
    </div>
  )
}

/**
 * Skeleton for company detail page: colored header, white card, then action explorer.
 */
export function CompanyPageSkeleton() {
  return (
    <div>
      <div style={{ backgroundColor: '#EC913C' }} className="lg:pt-6">
        <article className="lg:max-w-4xl mx-auto flex flex-col gap-[2px]">
          <header className="bg-white p-4 md:p-6 lg:rounded-t-xl">
            <div className="flex items-center gap-1 mb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-12 w-64 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </header>
          <div className="bg-white px-4 md:px-6 py-4">
            <Skeleton className="h-6 w-44 mb-1" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="bg-white px-4 md:px-6 py-4">
            <Skeleton className="h-6 w-52 mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>
          <div className="bg-white px-4 md:px-6 py-4 lg:rounded-b-xl">
            <Skeleton className="h-5 w-72" />
          </div>
        </article>
      </div>
      <ActionExplorerSkeleton />
    </div>
  )
}

/**
 * Skeleton for organising group detail page: colored header, white card (optional banner, title, logo), then action explorer.
 */
export function OrganisingGroupPageSkeleton() {
  return (
    <div>
      <div style={{ backgroundColor: '#3B97EC' }} className="lg:pt-6">
        <article className="lg:max-w-4xl mx-auto flex flex-col gap-[2px]">
          <header className="bg-white lg:rounded-t-xl overflow-hidden">
            <Skeleton className="w-full h-40 md:h-52" />
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-1 mb-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <Skeleton className="h-10 w-3/4 mb-2" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
                <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
              </div>
            </div>
          </header>
          <div className="bg-white px-4 md:px-6 py-4">
            <Skeleton className="h-6 w-16 mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <div className="bg-white px-4 md:px-6 py-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="bg-white px-4 md:px-6 py-4">
            <Skeleton className="h-6 w-44 mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>
          <div className="bg-white px-4 md:px-6 py-4 lg:rounded-b-xl">
            <Skeleton className="h-5 w-64" />
          </div>
        </article>
      </div>
      <ActionExplorerSkeleton />
    </div>
  )
}

/**
 * Skeleton for category detail page: header, description, then action explorer.
 */
export function CategoryPageSkeleton() {
  return (
    <div className="bg-[#EEE]">
      <article className="max-w-4xl mx-auto py-5 px-4 flex flex-col gap-4">
        <header>
          <Skeleton className="h-4 w-20 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-12 w-8 rounded" />
            <Skeleton className="h-12 w-48" />
          </div>
        </header>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </article>
      <ActionExplorerSkeleton />
    </div>
  )
}
