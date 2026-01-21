'use client'

import { ActionFilterContextProvider } from '@/components/ActionFilterContextProvider'
import { ActionFilter } from './components/ActionFilter'
import { Campaign, Category, Company, Country, Action, OrganisingGroup } from '@/payload-types'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ActionStats } from '@/components/ActionStats'
import { ActionList } from '@/components/ActionList'
import { useState } from 'react'
import { ZoomLevel } from '@/utils/global-state'

export function HomepageClient({
  actions,
  countries,
  categories,
  companies,
  organisingGroups,
  campaigns,
}: {
  actions: Action[]
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  campaigns: Campaign[]
}) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(ZoomLevel.Preview)

  return (
    <ActionFilterContextProvider
      actions={actions}
      countries={countries}
      categories={categories}
      companies={companies}
      organisingGroups={organisingGroups}
      campaigns={campaigns}
    >
      <div className="homepage">
        <ResizablePanelGroup direction="horizontal" className="w-full h-screen">
          <ResizablePanel defaultSize={40} className="hidden md:block">
            <div className="sticky top-6 h-[calc(100vh-60px)]">
              <ActionStats />
            </div>
          </ResizablePanel>
          <ResizableHandle className="hidden md:flex" />
          <ResizablePanel defaultSize={60}>
            <ActionList
              linkStyle="soft"
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              showFilter
              actionFilterProps={{
                years: false,
                campaigns: false,
              }}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ActionFilterContextProvider>
  )
}
