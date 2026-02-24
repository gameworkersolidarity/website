'use client'

import { useActionFilterContext } from './ActionFilterContextProvider'
import { Action } from '@/payload-types'
import { useMemo, useCallback, useRef } from 'react'
import { getDateInterval } from '@/utils/dates'
import { getYear, format, getQuarter } from 'date-fns'
import {
  addDays,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  isBefore,
} from 'date-fns'
import { scaleLinear, scaleTime } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { Bar, Line } from '@visx/shape'
import { Group } from '@visx/group'
import { localPoint } from '@visx/event'
import { useTooltip, useTooltipInPortal } from '@visx/tooltip'

export type FrequencyChartMouseValue = { date: Date }
export type PlotMouseEvent<T> = (value: T, event: MouseEvent) => void

const MARGIN = { top: 28, right: 10, bottom: 50, left: 36 }

export type BinEntry = {
  start: Date
  end: Date
  count: number
  sumHeadcount: number
  actions: Action[]
}

function getIntervalStep(
  interval: 'day' | 'week' | 'month' | 'quarter' | 'year',
): (d: Date, n: number) => Date {
  switch (interval) {
    case 'day':
      return addDays
    case 'week':
      return addWeeks
    case 'month':
      return addMonths
    case 'quarter':
      return addQuarters
    case 'year':
      return addYears
    default:
      return addMonths
  }
}

function getStartOfInterval(
  interval: 'day' | 'week' | 'month' | 'quarter' | 'year',
): (d: Date) => Date {
  switch (interval) {
    case 'day':
      return startOfDay
    case 'week':
      return startOfWeek
    case 'month':
      return startOfMonth
    case 'quarter':
      return startOfQuarter
    case 'year':
      return startOfYear
    default:
      return startOfMonth
  }
}

function buildBins(
  dateFrom: Date,
  dateTo: Date,
  interval: 'day' | 'week' | 'month' | 'quarter' | 'year',
): Array<{ start: Date; end: Date }> {
  const step = getIntervalStep(interval)
  const startOf = getStartOfInterval(interval)
  const bins: Array<{ start: Date; end: Date }> = []
  let cursor = startOf(dateFrom)
  while (isBefore(cursor, dateTo) || cursor.getTime() === dateTo.getTime()) {
    const end = step(cursor, 1)
    bins.push({ start: new Date(cursor), end })
    cursor = end
  }
  if (bins.length === 0) {
    bins.push({ start: new Date(dateFrom), end: new Date(dateTo) })
  }
  return bins
}

function binActions(
  actions: Action[],
  dateFrom: Date,
  dateTo: Date,
  interval: 'day' | 'week' | 'month' | 'quarter' | 'year',
): BinEntry[] {
  const binRanges = buildBins(dateFrom, dateTo, interval)
  return binRanges.map(({ start, end }) => {
    const actionsInBin = actions.filter((a) => {
      const t = new Date(a.date).getTime()
      return t >= start.getTime() && t < end.getTime()
    })
    const count = actionsInBin.length
    const sumHeadcount = actionsInBin.reduce((s, a) => s + (a.headcount ?? 0), 0)
    return { start, end, count, sumHeadcount, actions: actionsInBin }
  })
}

function formatBinLabel(
  start: Date,
  interval: 'day' | 'week' | 'month' | 'quarter' | 'year',
): string {
  switch (interval) {
    case 'year':
      return format(start, 'yyyy')
    case 'quarter':
      return `Q${getQuarter(start)} ${format(start, 'yyyy')}`
    case 'month':
      return format(start, 'MMM yyyy')
    case 'week':
    case 'day':
      return format(start, 'd MMM yyyy')
    default:
      return format(start, 'MMM yyyy')
  }
}

export function FrequencyChart({
  size,
  actionFilter,
  color,
  minYear,
  highlightDate,
  highlightColor,
  onMouseInteraction,
  countBy = 'actions',
}: {
  size: { width: number; height: number }
  actionFilter?: (action: Action) => boolean
  color: string
  minYear?: number
  countBy?: 'headcount' | 'actions'
  highlightDate?: Date
  highlightColor?: string
  onMouseInteraction?: PlotMouseEvent<FrequencyChartMouseValue[]>
}) {
  const { filteredActions } = useActionFilterContext()

  const extraFilteredActions = useMemo(() => {
    return actionFilter ? filteredActions.filter(actionFilter) : filteredActions
  }, [filteredActions, actionFilter])

  const dateFrom = useMemo(() => {
    if (minYear) return new Date(minYear, 0, 1)
    if (extraFilteredActions.length === 0) return new Date()
    return new Date(Math.min(...extraFilteredActions.map((a) => new Date(a.date).getTime())))
  }, [extraFilteredActions, minYear])

  const dateTo = useMemo(() => new Date(), [])

  const interval = useMemo(
    () => getDateInterval([dateFrom, dateTo]) as 'day' | 'week' | 'month' | 'quarter' | 'year',
    [dateFrom, dateTo],
  )

  const binnedData = useMemo(
    () => binActions(extraFilteredActions, dateFrom, dateTo, interval),
    [extraFilteredActions, dateFrom, dateTo, interval],
  )

  const innerWidth = Math.max(0, size.width - MARGIN.left - MARGIN.right)
  const innerHeight = Math.max(0, size.height - MARGIN.top - MARGIN.bottom)

  const xScale = useMemo(
    () =>
      scaleTime({
        domain: [dateFrom, dateTo],
        range: [0, innerWidth],
      }),
    [dateFrom, dateTo, innerWidth],
  )

  const maxValue = useMemo(() => {
    const values = binnedData.map((b) => (countBy === 'headcount' ? b.sumHeadcount : b.count))
    return Math.max(0, ...values)
  }, [binnedData, countBy])

  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, maxValue || 1],
        range: [innerHeight, 0],
      }),
    [maxValue, innerHeight],
  )

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<{ label: string; countLabel: string }>()

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  })

  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const HIDE_DELAY_MS = 80

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }
      const container =
        event.currentTarget instanceof SVGElement
          ? (event.currentTarget.ownerSVGElement ?? event.currentTarget)
          : event.currentTarget
      const point = localPoint(container as SVGElement, event)
      if (!point) return
      const x = point.x - MARGIN.left
      const date = xScale.invert(x)
      const bin = binnedData.find(
        (b) => date.getTime() >= b.start.getTime() && date.getTime() < b.end.getTime(),
      )
      if (bin) {
        const label = formatBinLabel(bin.start, interval)
        const value = countBy === 'headcount' ? bin.sumHeadcount : bin.count
        const countLabel = countBy === 'headcount' ? `${value} headcount` : `${value} actions`
        showTooltip({
          tooltipLeft: point.x,
          tooltipTop: point.y,
          tooltipData: { label, countLabel },
        })
        onMouseInteraction?.([{ date: bin.start }], event.nativeEvent)
      } else {
        hideTimeoutRef.current = setTimeout(() => {
          hideTimeoutRef.current = null
          hideTooltip()
        }, HIDE_DELAY_MS)
      }
    },
    [xScale, binnedData, interval, countBy, showTooltip, hideTooltip, onMouseInteraction],
  )

  const handleMouseLeave = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    hideTooltip()
  }, [hideTooltip])

  const getBarFill = useCallback(
    (bin: BinEntry) => {
      if (highlightDate && highlightColor) {
        const binYear = getYear(bin.start)
        const highlightYear = getYear(highlightDate)
        if (binYear === highlightYear) return highlightColor
      }
      return color
    },
    [color, highlightDate, highlightColor],
  )

  const xTickFormat = useCallback(
    (d: Date | number | { valueOf(): number }) => {
      const date = d instanceof Date ? d : new Date(typeof d === 'number' ? d : d.valueOf())
      switch (interval) {
        case 'year':
          return format(date, 'yyyy')
        case 'quarter':
          return format(date, 'yyyy')
        case 'month':
          return format(date, 'MMM')
        case 'week':
        case 'day':
          return format(date, 'd MMM')
        default:
          return format(date, 'MMM')
      }
    },
    [interval],
  )

  if (extraFilteredActions.length === 0) {
    return (
      <div className="pt-5 w-full flex items-center justify-center">
        <p className="opacity-50 text-sm">No data</p>
      </div>
    )
  }

  const yTicks = yScale.ticks(5).filter((t) => Number.isInteger(t))

  const tickColor = '#4b5563'
  const gridColor = '#d1d5db'

  return (
    <>
      <svg ref={containerRef} width={size.width} height={size.height} className="overflow-visible">
        <Group left={MARGIN.left} top={MARGIN.top}>
          {/* Plot area background */}
          <rect width={innerWidth} height={innerHeight} fill="#f9fafb" />
          {/* Y-axis label */}
          <text
            x={0}
            y={-10}
            fill={tickColor}
            fontSize={10}
            fontFamily="sans-serif"
            textAnchor="start"
          >
            ↑ Actions
          </text>
          {/* Y grid - horizontal lines only */}
          {yTicks.map((tick) => {
            const y = yScale(tick)
            return (
              <Line
                key={tick}
                x1={0}
                y1={y}
                x2={innerWidth}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
              />
            )
          })}
          {/* Bars */}
          {binnedData.map((bin) => {
            const value = countBy === 'headcount' ? bin.sumHeadcount : bin.count
            const barHeight = innerHeight - yScale(value)
            return (
              <Bar
                key={bin.start.getTime()}
                x={xScale(bin.start)}
                y={yScale(value)}
                width={Math.max(0, xScale(bin.end) - xScale(bin.start) - 1)}
                height={barHeight}
                fill={getBarFill(bin)}
              />
            )
          })}
          {/* Y axis - integer ticks only */}
          <AxisLeft
            scale={yScale}
            tickFormat={(d) => (Number(d) > Math.floor(Number(d)) ? '' : `${d}`)}
            stroke="none"
            tickStroke="none"
            tickLength={0}
            numTicks={5}
            tickLabelProps={() => ({
              fill: tickColor,
              fontSize: 10,
              fontFamily: 'sans-serif',
              textAnchor: 'end',
              dx: -8,
            })}
          />
          {/* X axis */}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke="none"
            tickStroke="none"
            tickLength={0}
            numTicks={8}
            tickFormat={xTickFormat}
            tickLabelProps={() => ({
              fill: tickColor,
              fontSize: 10,
              fontFamily: 'sans-serif',
              textAnchor: 'middle',
            })}
          />
          {/* Invisible overlay for tooltip and optional crosshair/highlight */}
          <rect
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: onMouseInteraction ? 'pointer' : 'default' }}
          />
        </Group>
      </svg>
      {tooltipOpen && tooltipData && tooltipLeft != null && tooltipTop != null && (
        <TooltipInPortal
          key="frequency-chart-tooltip"
          top={tooltipTop}
          left={tooltipLeft}
          className="rounded border border-gray-200 bg-white px-2 py-1.5 shadow-md absolute"
          style={{ zIndex: 1000 }}
        >
          <strong>{tooltipData.label}</strong> — {tooltipData.countLabel}
        </TooltipInPortal>
      )}
    </>
  )
}
