import {
  Axis,
  AreaSeries,
  BarSeries,
  XYChart,
  Tooltip,
  GlyphSeries,
  ThemeContext
} from '@visx/xychart';
import { ParentSize } from '@visx/responsive';
import { SolidarityAction } from '../data/types';
import { bin, extent, HistogramGeneratorNumber } from "d3-array"
import { scaleTime } from "d3-scale"
import useSWR from 'swr';
import { SolidarityActionsData } from '../pages/api/solidarityActions';
import { min, max, format } from 'date-fns';
import { timeMonth, timeMonths, timeYears } from 'd3-time';
import pluralize from 'pluralize';
import tw, { theme } from 'twin.macro'
import { timeFormat } from 'd3-time-format';
import { useMediaQuery } from '../utils/mediaQuery';
import { up } from '../utils/screens';
import { useMemo } from 'react';

export function CumulativeMovementChart ({ data, onSelectYear }: { data: SolidarityAction[], cumulative?: boolean, onSelectYear?: (year: string) => void }) {
  const actionDates = data.map(d => new Date(d.fields.Date))
  const minDate = min([new Date('2000-01-01'), ...actionDates])
  const maxDate = new Date()

  return (
    <div className='relative cursor-pointer' style={{ height: 120, maxHeight: '25vh' }}>
      <ParentSize>{(parent) => (
        <>
          {/* <h3 className='text-xs text-left absolute top-0 left-0 w-full font-mono uppercase'>
            Solidarity actions / year
          </h3> */}
          {/* <div className='text-xs'>
            <div className='space-x-1'>
              <span className='align-middle inline-block w-3 h-3 bg-gwOrangeLight' />
              <span className='align-middle'>Growth</span>
            </div>
            <div className='space-x-1'>
              <span className='align-middle inline-block w-3 h-3 bg-gwPink' />
              <span className='align-middle'>Frequency</span>
            </div>
          </div> */}
          <CumulativeChart
            data={data}
            minDate={minDate}
            maxDate={maxDate}
            width={parent.width}
            height={parent.height}
            onSelectYear={onSelectYear}
          />
        </>
      )}</ParentSize>
    </div>
  )
}

type Data = ReturnType<HistogramGeneratorNumber<SolidarityAction, number>>
type Datum = Data[0] & { y: number }

type AccessorFn = (d: Datum) => any

const accessors: {
  xAccessor: AccessorFn
  yAccessor: AccessorFn
} = {
  xAccessor: bin => Number(bin['x0']),
  yAccessor: bin => bin.y,
};

export function CumulativeChart ({
  data,
  height = 300,
  width = 300,
  minDate,
  maxDate,
  onSelectYear
}: {
  minDate: Date
  maxDate: Date
  data: SolidarityAction[]
  height: number,
  width: number,
  cumulative?: boolean
  onSelectYear?: (year: string) => void
}) {
  var yearBins = timeYears(timeMonth.offset(minDate, -1), timeMonth.offset(maxDate, 1));
  var monthBins = timeMonths(timeMonth.offset(minDate, -1), timeMonth.offset(maxDate, 1));

  const createBinFn = (dateBins: Date[]) => {
    return  bin<SolidarityAction, Date>()
      .thresholds(dateBins)
      .value(d => new Date(d.fields.Date))
      .domain([minDate, maxDate])
  }

  const yearBinFn = createBinFn(yearBins)

  // const cumulativeBinnedData = useMemo(() => {
  //   let d = yearBinFn(data)
  //   for(var i = 0; i < d.length; i++) {
  //     d[i]['y'] = d[i].length + (d?.[i-1]?.['y'] || 0)
  //   }
  //   return d
  // }, [data])

  const binnedData = useMemo(() => {
    let d = yearBinFn(data)
    for(var i = 0; i < d.length; i++) {
      d[i]['y'] = d[i].length || 0
    }
    return d
  }, [data])

  // const monthlyBinnedData = useMemo(() => {
  //   let d = createBinFn(monthBins)(data)
  //   for(var i = 0; i < d.length; i++) {
  //     d[i]['y'] = d[i].length || 0
  //   }
  //   return d
  // }, [data])

  const isSmallScreen = !useMediaQuery(up('sm'))

  return (
    <ThemeContext.Provider value={{
      backgroundColor: 'transparent',
      colors: [theme`colors.gwPink`],
      axisStyles: {
        x: {
          // @ts-ignore
          bottom: {
            axisLine: {
              // className: 'stroke-current text-gray-400',
              stroke: theme`colors.gray.400`
            },
            tickLine: {
              // stroke: theme`colors.gray.400`,
              // opacity: 0,
              stroke: 'transparent'
              // y2: 0
            },
            tickLabel: {
              className: 'font-mono fill-current text-gray-400 text-xs',
              dominantBaseline: "top",
              textAnchor: "middle"
            }
          }
        }
      }
    }}>
      <XYChart
        width={width}
        height={height}
        xScale={{ type: 'band' }}
        yScale={{ type: 'linear' }}
        margin={{ left: 0, right: 0, bottom: 50, top: 0 }}
      >
      {/* <AreaSeries
        dataKey="Cumulative"
        data={cumulativeBinnedData as any} {...accessors}
        // renderLine={true}
        // lineProps={{
        //   stroke: theme`colors.gwOrange`,
        //   strokeWidth: 2
        // }}
      /> */}
      {/* <GlyphSeries
        dataKey="Cumulative"
        data={cumulativeBinnedData as any} {...accessors}
        renderGlyph={(props, context) => {
          return (
            <circle fill={theme`colors.gwOrange`} cx={10} cy={props.y} cx={props.x} r={1.5} />
          )
        }}
      /> */}
      <BarSeries
        dataKey="Frequency"
        data={binnedData as any} {...accessors}
        onPointerUp={(e) => {
          onSelectYear?.(timeFormat('%Y')(accessors.xAccessor(e.datum)))
        }}
      />
      {/* <BarSeries
        dataKey="FrequencyMonth"
        data={monthlyBinnedData as any} {...accessors}
      /> */}
      {/* <GlyphSeries
        dataKey="Frequency"
        data={binnedData as any} {...accessors}
        renderGlyph={(props, context) => {
          return props.datum['y'] > 0 ? (
            <text x={props.x} y={props.y - 3}
              dominantBaseline="bottom" textAnchor="middle"
              className='fill-current text-green-500 font-bold text-xs font-mono'>
              +{props.datum['y']}
            </text>
          ) : null
        }}
      /> */}
      <Axis
        orientation="bottom"
        tickFormat={timeFormat(isSmallScreen ? "%y" : "%Y")}
      />
      </XYChart>
    </ThemeContext.Provider>
  )
}