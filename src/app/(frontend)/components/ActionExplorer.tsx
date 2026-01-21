import { ZoomLevel } from '@/utils/global-state'
import { useRef, useEffect, useState, useMemo } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'
import {
  ActionFilterContextProvider,
  ActionFilterContextProviderProps,
} from '@/components/ActionFilterContextProvider'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ActionStats } from '@/components/ActionStats'
import { ActionList } from '@/components/ActionList'
import { Campaign, Company, Country, OrganisingGroup, Category, Action } from '@/payload-types'
import { TimelineLabelProperty } from '@/global-types'
import { getRelatedObjects } from '@/utils/getRelatedObjects'
import { ActionFilterProps } from './ActionFilter'
import { getCSSVariable } from '@/utils/css'

export function ActionExplorer({
  actionFilterContextProps,
  actionFilterProps,
  showFilter,
  actions,
  primaryColor,
  linkStyle,
  timelineBy,
  overrideDefaultZoomLevel,
  graphs = true,
}: {
  actionFilterContextProps?: Partial<ActionFilterContextProviderProps>
  actionFilterProps?: Partial<ActionFilterProps>
  showFilter?: boolean
  actions: Action[]
  primaryColor?: string
  linkStyle: 'soft' | 'hard'
  timelineBy?: TimelineLabelProperty
  overrideDefaultZoomLevel?: ZoomLevel
  graphs?: boolean
}) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(
    overrideDefaultZoomLevel || ZoomLevel.Preview,
  )

  const collapsibleRef = useRef<ImperativePanelHandle>(null)

  useEffect(() => {
    if (collapsibleRef.current && zoomLevel === ZoomLevel.Timeline) {
      collapsibleRef.current.collapse()
    } else if (collapsibleRef.current && zoomLevel !== ZoomLevel.Timeline) {
      collapsibleRef.current.expand()
    }
  }, [collapsibleRef, zoomLevel])

  const relatedObjects = useMemo(() => getRelatedObjects(actions), [actions])

  return (
    <ActionFilterContextProvider
      actions={actions}
      countries={relatedObjects.countries}
      categories={relatedObjects.categories}
      companies={relatedObjects.companies}
      organisingGroups={relatedObjects.organisingGroups}
      campaigns={relatedObjects.campaigns}
      {...(actionFilterContextProps || {})}
    >
      <ResizablePanelGroup direction="horizontal" className="w-full h-screen bg-background">
        <ResizablePanel
          defaultSize={40}
          collapsible
          ref={collapsibleRef}
          className="transition-all duration-500 ease-in-out hidden md:block"
        >
          <div className="sticky top-6 h-[calc(100vh-60px)]">
            <ActionStats graphs={false} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="hidden md:flex" />
        <ResizablePanel defaultSize={60}>
          <ActionList
            linkStyle={linkStyle}
            timelineBy={timelineBy}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            showFilter={showFilter}
            actionFilterProps={actionFilterProps}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </ActionFilterContextProvider>
  )
}
