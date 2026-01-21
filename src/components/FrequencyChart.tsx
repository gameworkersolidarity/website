'use client'

import { useActionFilterContext } from './ActionFilterContextProvider'
import { Action } from '@/payload-types'
import { useMemo } from 'react'
import dynamic from 'next/dynamic'
const RenderPlot = dynamic(() => import('./Plot').then((mod) => mod.RenderPlot), { ssr: false })
import { PlotMouseEvent, usePlotConfig } from './Plot'
import { PlotOptions } from '@observablehq/plot'
import * as Plot from '@observablehq/plot'
import { getDateInterval } from '@/utils/dates'
import { formatDate, getYear } from 'date-fns'

export function FrequencyChart({
  size,
  actionFilter,
  color,
  minYear,
  transformPlotConfig,
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
  transformPlotConfig?: (config: PlotOptions, plot: typeof Plot) => PlotOptions
  highlightDate?: Date
  highlightColor?: string
  onMouseInteraction?: PlotMouseEvent<any>
}) {
  const { filteredActions } = useActionFilterContext()

  const extraFilteredActions = useMemo(() => {
    return actionFilter ? filteredActions.filter(actionFilter) : filteredActions
  }, [filteredActions, actionFilter])

  const dateFrom = useMemo(() => {
    if (minYear) {
      return new Date(minYear, 0, 1)
    }
    return new Date(
      Math.min(...extraFilteredActions.map((action) => new Date(action.date).getTime())),
    )
  }, [extraFilteredActions, minYear])

  const plotConfig = usePlotConfig(
    (Plot) => {
      try {
        const domain = [dateFrom, new Date()]
        let config: PlotOptions = {
          width: size.width,
          height: size.height,
          marginBottom: 50,
          y: {
            grid: true,
          },
          x: {
            domain,
          },
          marks: [
            Plot.axisY({
              tickFormat: (d) => (d > Math.floor(d) ? '' : `${d}`),
              tickSize: 0,
            }),
            Plot.axisX({
              textAnchor: 'start',
              tickSize: 0,
            }),
            Plot.rectY(
              extraFilteredActions,
              Plot.binX(
                {
                  y: countBy === 'headcount' ? 'sum' : 'count',
                },
                {
                  x: (d: Action) => new Date(d.date),
                  ...(countBy === 'headcount' ? { y: 'headcount' } : {}),
                  // y: countBy,
                  interval: Plot.utcInterval(`1 ${getDateInterval(domain)}`),
                  // @ts-expect-error - fill is, in fact, a valid property for BinXInputs
                  // fill: color,
                  fill: (d: Action) => {
                    try {
                      if (highlightDate && getYear(new Date(d.date)) === getYear(highlightDate)) {
                        return highlightColor
                      }
                      return color
                    } catch {
                      return color
                    }
                  },
                  tip: true,
                },
              ),
            ),
            // highlightDate
            //   ? Plot.ruleX([new Date(highlightDate)], { stroke: highlightColor, strokeWidth: 3 })
            //   : null,
            // Plot.tip(
            //   extraFilteredActions,
            //   Plot.pointerX({
            //     x: (d) => new Date(d.date),
            //     y: 'initiator',
            //   }),
            // ),
          ],
        }
        if (transformPlotConfig) {
          config = transformPlotConfig(config, Plot)
        }
        return Plot.plot(config)
      } catch (error) {
        console.error(error)
        return null
      }
    },
    [
      size.width,
      size.height,
      countBy,
      extraFilteredActions,
      dateFrom,
      color,
      highlightDate,
      highlightColor,
      transformPlotConfig,
    ],
  )

  if (extraFilteredActions.length === 0) {
    return (
      <div className="pt-5 w-full flex items-center justify-center">
        <p className="opacity-50 text-sm">No data</p>
      </div>
    )
  }

  return <RenderPlot plot={plotConfig} onMouseInteraction={onMouseInteraction} />
}
