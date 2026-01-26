'use client'

import { Category, Company, Country, Action, OrganisingGroup } from '@/payload-types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActionCard } from './ActionCard'
import {
  differenceInDays,
  differenceInMonths,
  differenceInQuarters,
  differenceInWeeks,
  differenceInYears,
  formatDate,
  getWeek,
  max,
} from 'date-fns'
import { bin, extent } from 'd3-array'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { getCSSVariable } from '@/utils/css'
import { scaleLinear, scaleTime } from '@visx/scale'
import { AxisBottom } from '@visx/axis'
import { HtmlLabel } from '@visx/annotation'
import { LinePath, Circle, Line, Bar } from '@visx/shape'
import { Group } from '@visx/group'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { CategoryLabel } from './CategoryLabel'
import { CountryLabel } from './CountryLabel'
import { OrganisingGroupLabel } from './OrganisingGroupLabel'
import { CompanyLabel } from './CompanyLabel'
import { TimelineLabelProperty } from '@/global-types'

export function ActionTimeline({
  actions,
  labelProperty,
  searchQuery,
}: {
  actions: Action[]
  labelProperty?: TimelineLabelProperty
  searchQuery?: string
}) {
  const sortedActions = useMemo(
    () => [...actions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [actions],
  )
  const [currentActionId, setCurrentActionId] = useState<string | null>(
    sortedActions[0]?.id || null,
  )

  // Handle keyboard navigation for arrow keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys when not typing in an input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        const currentIndex = sortedActions.findIndex((a) => a.id === currentActionId)
        if (currentIndex === -1) return

        if (event.key === 'ArrowLeft') {
          // Navigate to previous (earlier) action
          if (currentIndex > 0) {
            setCurrentActionId(sortedActions[currentIndex - 1].id)
          }
        } else {
          // Navigate to next (later) action
          if (currentIndex < sortedActions.length - 1) {
            setCurrentActionId(sortedActions[currentIndex + 1].id)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sortedActions, currentActionId, setCurrentActionId])

  return (
    <div className="@container">
      <div className="py-4 px-5 @5xl:px-8">
        <Timeline
          actions={sortedActions}
          currentActionId={currentActionId}
          setCurrentActionId={setCurrentActionId}
          labelProperty={labelProperty}
        />
      </div>
      <div>
        <Slideshow
          actions={sortedActions}
          currentActionId={currentActionId}
          setCurrentActionId={setCurrentActionId}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  )
}

export function Slideshow({
  actions,
  currentActionId,
  setCurrentActionId: __setCurrentActionId,
  searchQuery,
}: {
  actions: Action[]
  currentActionId: string | null
  setCurrentActionId: (id: string) => void
  searchQuery?: string
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [autoplay, setAutoplay] = useState(false)

  const setCurrentActionId = useCallback(
    (id: string, autoplay: boolean = false) => {
      __setCurrentActionId(id)
      setAutoplay(autoplay)
    },
    [__setCurrentActionId, setAutoplay],
  )

  // Scroll to current action when it changes
  useEffect(() => {
    if (!currentActionId || !scrollContainerRef.current) return

    const itemElement = itemRefs.current.get(currentActionId)
    if (itemElement) {
      itemElement.scrollIntoView({
        // @ts-expect-error - container is a valid option for scrollIntoView
        container: 'nearest',
        behavior: 'smooth',
        block: 'start',
        inline: 'center',
      })
    }
  }, [currentActionId])

  // Handle scroll actions to update current action
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2
    // Find the item closest to the center
    let closestItem: { id: string; distance: number } | null = null
    for (const [id, element] of itemRefs.current.entries()) {
      const rect = element.getBoundingClientRect()
      const itemCenter = rect.left + rect.width / 2
      const distance = Math.abs(itemCenter - containerCenter)
      if (!closestItem || distance < closestItem.distance) {
        closestItem = { id, distance }
      }
    }
    if (closestItem && closestItem.id !== currentActionId) {
      setCurrentActionId(closestItem.id)
    }
  }, [currentActionId, setCurrentActionId])

  const sortedActions = useMemo(
    function sortActionsByOldestFirst() {
      return [...actions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    },
    [actions],
  )

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(() => {
        const index = sortedActions.findIndex((e) => e.id === currentActionId)
        if (index === -1) return
        setCurrentActionId(
          index < sortedActions.length - 1 ? sortedActions[index + 1].id : sortedActions[0].id,
        )
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [autoplay, currentActionId, sortedActions, setCurrentActionId])

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        onScrollEndCapture={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth items-start py-4"
      >
        {sortedActions.map((action, index, list) => (
          <div
            key={action.id}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(action.id, el)
              } else {
                itemRefs.current.delete(action.id)
              }
            }}
            className="shrink-0 w-full snap-center flex items-center justify-center gap-1 @md:gap-4"
          >
            <ArrowLeft
              className={twMerge('w-20 cursor-pointer', index > 0 ? 'block' : 'invisible')}
              size={20}
              onClick={() => setCurrentActionId(list[index - 1].id)}
            />
            <ActionCard data={action} links searchQuery={searchQuery} />
            <ArrowRight
              className={twMerge(
                'w-20 cursor-pointer',
                index < sortedActions.length - 1 ? 'block' : 'invisible',
              )}
              size={20}
              onClick={() => setCurrentActionId(list[index + 1].id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Timeline({
  actions,
  currentActionId,
  setCurrentActionId,
  labelProperty = 'categories',
}: {
  actions: Action[]
  currentActionId: string | null
  setCurrentActionId: (id: string) => void
  labelProperty?: TimelineLabelProperty
}) {
  const [elementRef, size] = useElementSize()
  const isTinyScreen = size.width <= 480
  const isSmallScreen = size.width > 480 && size.width <= 768
  const isMediumScreen = size.width > 768 && size.width <= 1023

  // Bining labels
  const minSkip = 1
  const maxSkip = isTinyScreen ? 30 : isSmallScreen ? 18 : isMediumScreen ? 14 : 10
  const itemsPerBin = isTinyScreen || isSmallScreen ? 1 : isMediumScreen ? 2 : 3
  // Heights of labels
  const highlightOffset = 5
  const gap = 20
  const numLevels = 3
  const divHeight = 270

  const margin = { top: 15, right: 10, bottom: 25, left: 10 }
  const width = size.width - margin.left - margin.right
  const height = divHeight - margin.top - margin.bottom
  const timelineY = height / 2

  // Calculate date range
  const dateRange = useMemo(() => extent(actions.map((e) => new Date(e.date))), [actions])
  const minDate = useMemo(() => dateRange[0] || new Date(), [dateRange])
  const maxDate = useMemo(() => dateRange[1] || new Date(), [dateRange])
  const dayRange = useMemo(() => differenceInDays(maxDate, minDate), [maxDate, minDate])

  // Determine number of ticks based on date range
  const xScaleLevel = useMemo(() => {
    if (dayRange <= 21) return 'day'
    if (dayRange <= 180) return 'week'
    if (dayRange <= 365 * 2) return 'month'
    if (dayRange <= 365 * 5) return 'quarter'
    if (dayRange <= 365 * 10) return 'year'
    return 'decade'
  }, [dayRange])

  // Helper for date Bin
  const getBin = useCallback(
    (date: Date) => {
      if (typeof date === 'number') {
        date = new Date(date)
      }
      if (typeof date === 'string') {
        date = new Date(date)
      }
      switch (xScaleLevel) {
        case 'year':
          // Bin by year
          return date.getFullYear().toString()
        case 'decade':
          // get Bins of 3.333 years
          return `${Math.floor(date.getFullYear() / 3.333) * 3.333}-${Math.floor(date.getFullYear() / 3.333) * 3.333 + 3.333}`
        case 'quarter':
          // Bin by year and quarter
          return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
        case 'month':
          // Bin by year and month
          return `${date.getFullYear()}-${date.getMonth()}`
        case 'week':
          // Bin by year and ISO week number
          // ISO week inspried from https://stackoverflow.com/a/6117889
          const weekNum = getWeek(date)
          return `${date.getFullYear()}-W${weekNum}`
        case 'day':
        default:
          // Bin by full day
          return formatDate(date, 'yyyy-MM-dd')
      }
    },
    [xScaleLevel],
  )

  const numTicks = useMemo(() => {
    if (xScaleLevel === 'day') return 7
    if (xScaleLevel === 'week') return 5
    if (xScaleLevel === 'month') return 4
    if (xScaleLevel === 'quarter') return 4
    if (xScaleLevel === 'year') return 5
    return 6
  }, [xScaleLevel])

  const numBins = useMemo(() => {
    if (xScaleLevel === 'day') return differenceInDays(maxDate, minDate)
    if (xScaleLevel === 'week') return differenceInWeeks(maxDate, minDate)
    if (xScaleLevel === 'month') return differenceInMonths(maxDate, minDate)
    if (xScaleLevel === 'quarter') return differenceInQuarters(maxDate, minDate)
    return differenceInYears(maxDate, minDate)
  }, [xScaleLevel, minDate, maxDate])

  // Create time scale
  const xScale = useMemo(
    () =>
      scaleTime({
        domain: [minDate, maxDate],
        range: [0, width],
      }),
    [minDate, maxDate, width],
  )

  // Sort actions by date
  const sortedActions = useMemo(
    () => [...actions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [actions],
  )

  // Handle click on action
  const handleClick = useCallback(
    (action: Action) => {
      setCurrentActionId(action.id)
    },
    [setCurrentActionId],
  )

  // Get color for action
  const getActionColor = useCallback((action: Action) => {
    return action.initiator === 'WORKER_LED'
      ? getCSSVariable('--color-gw-blue', false, '#000')
      : getCSSVariable('--color-gw-orange', false, '#000')
  }, [])

  // Get radius for action
  const getActionRadius = useCallback(
    (action: Action) => {
      if (action.id === currentActionId) return 8
      if (action.featured) return 7
      return 5
    },
    [currentActionId],
  )

  const actionsWithBins = useMemo(() => {
    return sortedActions.map((action) => {
      return {
        action,
        bin: getBin(new Date(action.date)),
      }
    })
  }, [sortedActions, getBin])

  const binnedActions = useMemo(() => {
    const binFn = bin<Action, Date>()
      .domain([minDate, maxDate])
      .value(
        // @ts-expect-error - d is an Action
        (d) => (d?.date ? new Date(d?.date).getTime() : new Date().getTime()),
      )
      .thresholds(xScale.ticks(numBins))
    const bins = binFn(sortedActions)
    return bins
  }, [sortedActions, minDate, maxDate, numBins, xScale])

  const histogramYScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, max(binnedActions.map((e) => e.length))],
        range: [0, height / 3.75],
      }),
    [binnedActions, height],
  )

  function getLabelPositionMetadata(action: Action) {
    if (!action.id || !currentActionId) {
      return {
        shouldAppear: false,
        indexInBin: 0,
        dynamicSkipCount: 0,
      }
    }
    // Always show featured actions and currently selected action
    if (action.featured || action.id === currentActionId) {
      return {
        shouldAppear: true,
        indexInBin: 0,
        dynamicSkipCount: 0,
      }
    }
    if (!action[labelProperty]) {
      return {
        shouldAppear: false,
        indexInBin: 0,
        dynamicSkipCount: 0,
      }
    }

    const targetBin = getBin(new Date(action.date))
    // How many actions in the same Bin?
    const actionsInBin = actionsWithBins.filter((e) => e.bin === targetBin)
    // Dynamic skipCount: more in the Bin = higher skip
    // For many actions display fewer: set minSkip 1, maxSkip e.g. 7
    const dynamicSkipCount = Math.max(
      Math.min(Math.ceil(actionsInBin.length / itemsPerBin), maxSkip),
      minSkip,
    )

    // For deterministic spacing within Bin, get positions in this Bin
    const thisBinIndices = actionsWithBins
      .map((e, i) => ({ id: e.action.id, b: e.bin, idx: i }))
      .filter((row) => row.b === targetBin)

    const thisActionIndexInBin = thisBinIndices.findIndex((row) => row.id === action.id)

    // Show one every dynamicSkipCount in the same Bin
    return {
      shouldAppear: thisActionIndexInBin % dynamicSkipCount === 0,
      indexInBin: thisActionIndexInBin,
      dynamicSkipCount,
    }
  }

  // Calculate global index for all labels that should appear
  const globalLabelIndex = useMemo(() => {
    const indexMap = new Map<string, number>()
    let globalIndex = 0

    sortedActions.forEach((action) => {
      if (!action.id || !currentActionId) {
        return
      }

      // Always show featured actions and currently selected action
      if (action.featured || action.id === currentActionId) {
        indexMap.set(action.id, globalIndex)
        globalIndex++
        return
      }

      const targetBin = getBin(new Date(action.date))
      // How many actions in the same Bin?
      const actionsInBin = sortedActions.filter((e) => getBin(new Date(e.date)) === targetBin)
      // Dynamic skipCount: more in the Bin = higher skip
      // For many actions display fewer: set minSkip 1, maxSkip e.g. 7
      const dynamicSkipCount = Math.max(
        Math.min(Math.ceil(actionsInBin.length / itemsPerBin), maxSkip),
        minSkip,
      )

      // For deterministic spacing within Bin, get positions in this Bin
      const thisBinIndices = sortedActions
        .map((e, i) => ({ id: e.id, b: getBin(new Date(e.date)), idx: i }))
        .filter((row) => row.b === targetBin)

      const thisActionIndexInBin = thisBinIndices.findIndex((row) => row.id === action.id)

      // Show one every dynamicSkipCount in the same Bin
      if (thisActionIndexInBin % dynamicSkipCount === 0) {
        indexMap.set(action.id, globalIndex)
        globalIndex++
      }
    })

    return indexMap
  }, [sortedActions, currentActionId, getBin, minSkip, maxSkip, itemsPerBin])

  function getLabelPosition(globalIndex: number, actionId: string | null, offset: number = 0) {
    if (currentActionId && actionId === currentActionId) {
      const aboveBelow = -1
      const level = numLevels + 1
      const y = timelineY + aboveBelow * level * gap + offset * aboveBelow
      return {
        y,
        aboveBelow,
        level,
      }
    } else {
      const aboveBelow = globalIndex % 2 === 0 ? -1 : 1
      const level = (globalIndex % numLevels) + 1
      const y = timelineY + aboveBelow * level * gap + offset * aboveBelow
      return {
        y,
        aboveBelow,
        level,
      }
    }
  }

  return (
    <div ref={elementRef} className="h-full w-full">
      <svg
        width={size.width}
        height={divHeight}
        style={{ overflow: 'visible' }}
        className="z-30 relative"
      >
        <Group left={margin.left} top={margin.top}>
          {/* Histogram of actions */}
          {!!sortedActions.length &&
            sortedActions.length > 10 &&
            binnedActions.map((bin) => {
              const barHeight = histogramYScale(bin.length)
              return (
                <Bar
                  key={bin.x0!.toString()}
                  x={xScale(bin.x0!)}
                  y={height - barHeight}
                  width={xScale(bin.x1!) - xScale(bin.x0!)}
                  height={barHeight}
                  fill={getCSSVariable('--color-gw-pink', true, '#EEE')}
                  opacity={0.3}
                />
              )
            })}

          {/* Grid lines */}
          {xScale.ticks(numTicks).map((tick, i) => {
            const x = xScale(tick)
            return (
              <Line
                key={i}
                x1={x}
                y1={0}
                x2={x}
                y2={height}
                stroke="#CCC"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
            )
          })}

          {/* Timeline line */}
          <LinePath
            data={sortedActions}
            x={(d) => xScale(new Date(d.date))}
            y={timelineY}
            stroke="#9ca3af"
            strokeWidth={2}
          />

          {/* Vertical ines from circle to text labels */}
          {sortedActions.map((action, index) => {
            const x = xScale(new Date(action.date))
            const { shouldAppear } = getLabelPositionMetadata(action)
            if (!shouldAppear) return null
            const globalIndex = globalLabelIndex.get(action.id) ?? 0
            const { y } = getLabelPosition(
              globalIndex,
              action.id,
              action.id === currentActionId ? highlightOffset : 0,
            )
            return (
              <Line
                key={`line-${action.id}`}
                x1={x}
                y1={timelineY}
                x2={x}
                y2={y}
                stroke={getActionColor(action)}
                strokeWidth={1}
              />
            )
          })}

          {/* Action dots */}
          {sortedActions.map((action) => {
            const x = xScale(new Date(action.date))
            const color = getActionColor(action)
            const radius = getActionRadius(action)
            return (
              <g key={action.id}>
                <Circle
                  cx={x}
                  cy={timelineY}
                  r={radius}
                  fill={color}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleClick(action)}
                />
                {action.featured && (
                  <>
                    <Circle
                      cx={x}
                      cy={timelineY}
                      r={radius + 2}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleClick(action)}
                    />
                  </>
                )}
              </g>
            )
          })}

          {/* Labels above timeline */}
          {sortedActions.map((action, index) => {
            const positionMetadata = getLabelPositionMetadata(action)
            if (!positionMetadata.shouldAppear) return null
            const x = xScale(new Date(action.date))
            const globalIndex = globalLabelIndex.get(action.id) ?? 0
            const { y, aboveBelow } = getLabelPosition(
              globalIndex,
              action.id,
              action.id === currentActionId ? highlightOffset : 0,
            )
            // Estimate label dimensions - generous defaults for Firefox/Safari compatibility
            // Firefox/Safari require explicit width/height on foreignObject
            const estimatedWidth = 300 // px - generous width to accommodate longer labels
            // const estimatedHeight = action.id === currentActionId ? 60 : 40 // px - more height if date is shown

            return (
              <HtmlLabel
                key={`label-${action.id}`}
                x={x}
                y={y}
                horizontalAnchor="middle"
                verticalAnchor={aboveBelow === -1 ? 'end' : 'start'}
                showAnchorLine={false}
                containerStyle={{
                  overflow: 'visible',
                  pointerEvents: 'auto',
                }}
              >
                {/* <pre className="text-xs">{JSON.stringify(positionMetadata, null, 2)}</pre> */}
                <div
                  className={twMerge(
                    'whitespace-nowrap flex flex-col items-center text-center cursor-pointer',
                    action.id === currentActionId && 'bg-snot-300 rounded-md px-2 py-1 border-none',
                    action.featured && 'underline',
                  )}
                  style={{
                    display: 'flex',
                    width: 'max-content',
                    maxWidth: `${estimatedWidth}px`,
                  }}
                  onClick={() => handleClick(action)}
                >
                  {action.id === currentActionId && (
                    <div className="text-xs">
                      {formatDate(new Date(action.date), 'dd MMM yyyy')}
                    </div>
                  )}
                  <div className="text-xs font-bold flex flex-row flex-wrap justify-center items-center">
                    {labelProperty === 'categories'
                      ? action.categories?.map((c) => (
                          <CategoryLabel category={c as Category} key={(c as Category).id} />
                        ))
                      : null}
                    {labelProperty === 'companies'
                      ? action.companies?.map((c) => (
                          <CompanyLabel company={c as Company} key={(c as Company).id} />
                        ))
                      : null}
                    {labelProperty === 'organisingGroups'
                      ? action.organisingGroups?.map((c) => (
                          <OrganisingGroupLabel
                            organisingGroup={c as OrganisingGroup}
                            key={(c as OrganisingGroup).id}
                          />
                        ))
                      : null}
                    {labelProperty === 'countries'
                      ? action.countries?.map((c) => (
                          <CountryLabel country={c as Country} key={(c as unknown as Country).id} />
                        ))
                      : null}
                    {labelProperty === 'location' ? action.location : null}
                    {labelProperty === 'name' ? action.name : null}
                  </div>
                </div>
              </HtmlLabel>
              // <Group
              //   key={`label-${action.id}`}
              //   transform={`translate(${x}, ${getLabelY(index, action.id)})`}
              // >
              //   {action.id === currentActionId && (
              //     <g className="-translate-y-4" fill="#fde68a">
              //       <rect
              //         x={-50}
              //         y={-25}
              //         width={100}
              //         height={26}
              //         rx={10}
              //         stroke="#f59e42"
              //         strokeWidth={1.5}
              //       />
              //       <Text
              //         textAnchor="middle"
              //         fontSize={12}
              //         fontWeight="bold"
              //         fill="currentColor"
              //         dy="-9"
              //       >
              //         {formatDate(new Date(action.date), 'dd MMM yy')}
              //       </Text>
              //     </g>
              //   )}
              //   <Text textAnchor="middle" fontSize={12} fontWeight="bold" fill="currentColor">
              //     {labelText}
              //   </Text>
              // </Group>
            )
          })}

          {/* Date labels below timeline */}
          {/* {sortedActions.map((action) => {
            const x = xScale(new Date(action.date))
            const dateText = formatDate(new Date(action.date), 'dd MMM yy')
            return (
              <Text
                key={`date-${action.id}`}
                x={x}
                y={timelineY + 30}
                textAnchor="middle"
                fontSize={14}
                fontWeight="bold"
                fill="currentColor"
              >
                {dateText}
              </Text>
            )
          })} */}

          {/* X-axis */}
          <AxisBottom
            top={height}
            scale={xScale}
            numTicks={numTicks}
            tickFormat={(d) =>
              formatDate(
                d as Date,
                xScaleLevel === 'day'
                  ? 'dd MMM yyyy'
                  : xScaleLevel === 'week'
                    ? 'dd MMM'
                    : xScaleLevel === 'month'
                      ? 'MMM yyyy'
                      : xScaleLevel === 'quarter'
                        ? 'yyyy'
                        : xScaleLevel === 'year'
                          ? 'yyyy'
                          : 'yyyy',
              )
            }
            stroke="none"
            tickStroke="none"
            tickLabelProps={() => ({
              fill: '#777',
              fontSize: 12,
              textAnchor: 'middle' as const,
            })}
          />
        </Group>
      </svg>
    </div>
  )
}
