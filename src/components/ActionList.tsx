'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { History, Newspaper, Rows2, Rows4 } from 'lucide-react'
import { CompactActionList } from './CompactActionList'
import { ActionsList } from './ActionCard'
import { ZoomLevel } from '@/utils/global-state'
import { useActionFilterContext } from './ActionFilterContextProvider'
import { AnimatedNumber } from './AnimatedNumber'
import pluralize from 'pluralize'
import dynamic from 'next/dynamic'
const ActionTimeline = dynamic(
  () => import('../components/ActionsTimeline').then((mod) => mod.ActionTimeline),
  { ssr: false },
)
import { ActionFilter, ActionFilterProps } from '@/app/(frontend)/components/ActionFilter'
import { TimelineLabelProperty } from '@/global-types'

export function ZoomlevelSelector({
  value,
  onChange,
  includeTimeline = false,
}: {
  value: ZoomLevel
  onChange: (value: ZoomLevel) => void
  includeTimeline?: boolean
}) {
  return (
    <Tabs defaultValue={value} value={value} onValueChange={(e) => onChange(e as ZoomLevel)}>
      <TabsList>
        {includeTimeline && (
          <TabsTrigger value={ZoomLevel.Timeline}>
            <History /> Timeline
          </TabsTrigger>
        )}
        <TabsTrigger value={ZoomLevel.Compact}>
          <Rows4 /> Compact
        </TabsTrigger>
        <TabsTrigger value={ZoomLevel.Preview}>
          <Rows2 /> Preview
        </TabsTrigger>
        <TabsTrigger value={ZoomLevel.Detailed}>
          <Newspaper /> Detailed
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export function ActionList({
  linkStyle = 'hard',
  timelineBy,
  zoomLevel,
  setZoomLevel,
  showFilter,
  actionFilterProps,
}: {
  linkStyle?: 'soft' | 'hard'
  timelineBy?: TimelineLabelProperty
  zoomLevel: ZoomLevel
  setZoomLevel: (value: ZoomLevel) => void
  showFilter?: boolean
  hideYear?: boolean
  actionFilterProps?: Partial<ActionFilterProps>
}) {
  const { filteredActions: actions, searchQuery } = useActionFilterContext()

  return (
    <div className="flex flex-col gap-2 @container">
      <header className="mt-1 md:sticky top-6 bg-background pt-3 z-40">
        <div className="px-4 flex flex-col @xl:flex-row justify-between gap-2 @xl:gap-4 pb-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl lg:text-5xl font-bold font-identity inline-flex items-baseline">
              <AnimatedNumber value={actions.length} className="align-baseline" />
              <span className="ml-1">{pluralize('action', actions.length, false)}</span>
            </h2>
          </div>
          <ZoomlevelSelector
            value={zoomLevel}
            onChange={setZoomLevel}
            includeTimeline={!!timelineBy}
          />
        </div>
        {showFilter && (
          <div className="px-4 py-2 border-t border-b border-gray-200">
            <ActionFilter {...(actionFilterProps || {})} />
          </div>
        )}
      </header>
      {zoomLevel === ZoomLevel.Compact ? (
        <div>
          <CompactActionList actions={actions} linkStyle={linkStyle} searchQuery={searchQuery} />
        </div>
      ) : zoomLevel === ZoomLevel.Preview ? (
        <div className="flex flex-col gap-4 px-4 pb-4">
          <ActionsList data={actions} searchQuery={searchQuery} />
        </div>
      ) : zoomLevel === ZoomLevel.Timeline ? (
        <div className="flex flex-col gap-4 px-4 pb-4">
          <ActionTimeline actions={actions} labelProperty={timelineBy} searchQuery={searchQuery} />
        </div>
      ) : (
        <div className="flex flex-col gap-8 px-4 pb-4">
          <ActionsList data={actions} fullDisplay searchQuery={searchQuery} />
        </div>
      )}
    </div>
  )
}
