import {
  Axis,
  Grid,
  BarSeries,
  XYChart,
  Tooltip,
  GlyphSeries
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

export function CumulativeMovementChart ({ data }: { data: SolidarityAction[], cumulative?: boolean }) {
  const actionDates = data.map(d => new Date(d.fields.Date))
  const minDate = min([new Date('2000-01-01'), ...actionDates])
  const maxDate = new Date()

  return (
    <div className='flex flex-col justify-center text-center align-center relative' style={{ height: 160, maxHeight: '80vh' }}>
      <ParentSize>{(parent) => (
        <>
          <h3 className='text-xs text-left text-gwPink absolute top-0 left-0 font-mono uppercase'>
            Worker actions / year
          </h3>
          <CumulativeChart
            data={data}
            minDate={minDate}
            maxDate={maxDate}
            width={parent.width}
            height={parent.height}
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
  maxDate
}: {
  minDate: Date
  maxDate: Date
  data: SolidarityAction[]
  height: number,
  width: number,
  cumulative?: boolean
}) {
  var dateBins = timeYears(timeMonth.offset(minDate, -1), timeMonth.offset(maxDate, 1));

  const binFn = bin<SolidarityAction, Date>()
    .thresholds(dateBins)
    .value(d => new Date(d.fields.Date))
    .domain([minDate, maxDate])

  const cumulativeBinnedData = useMemo(() => {
    let d = binFn(data)
    for(var i = 0; i < d.length; i++) {
      d[i]['y'] = d[i].length + (d?.[i-1]?.['y'] || 0)
    }
    return d
  }, [data])

  const binnedData = useMemo(() => {
    let d = binFn(data)
    for(var i = 0; i < d.length; i++) {
      d[i]['y'] = d[i].length || 0
    }
    return d
  }, [data])

  const isSmallScreen = !useMediaQuery(up('sm'))

  return (
    <XYChart
      width={width}
      height={height}
      xScale={{ type: 'band' }}
      yScale={{ type: 'linear' }}
      margin={{ left: 0, right: 0, bottom: 20, top: 0 }}
    >
    <BarSeries
      dataKey="Cumulative"
      data={cumulativeBinnedData as any} {...accessors}
      colorAccessor={d => theme`colors.gwOrangeLight`}
    />
    <BarSeries
      dataKey="Frequency"
      data={binnedData as any} {...accessors}
      colorAccessor={d => theme`colors.gwPink`}
    />
    <GlyphSeries
      dataKey="Frequency"
      data={binnedData as any} {...accessors}
      // colorAccessor={d => theme`colors.gwPink`}
      renderGlyph={(props, context) => {
        return props.datum['y'] > 0 ? (
          <text x={props.x} y={props.y - 3}
            dominantBaseline="bottom" textAnchor="middle"
            className='fill-current text-green-500 font-bold text-xs font-mono'>
            +{props.datum['y']}
          </text>
        ) : null
      }}
    />
    <Axis
      orientation="bottom"
      axisLineClassName='stroke-current text-gray-400'
      tickFormat={timeFormat(isSmallScreen ? "%y" : "%Y")}
      tickLabelProps={props => ({
        ...props,
        style: tw`font-mono fill-current text-gray-400`
      })}
    />
    <Tooltip<Datum>
      snapTooltipToDatumX
      snapTooltipToDatumY
      showVerticalCrosshair
      showSeriesGlyphs
      glyphStyle={{
        fill: theme`colors.gwOrange`
      }}
      renderTooltip={({ tooltipData, colorScale }) =>
        <div className='text-md font-mono'>
          {tooltipData?.nearestDatum ? <>
            <div className='text-md'>
              {pluralize('action', accessors.yAccessor(tooltipData.datumByKey['Frequency'].datum), true)} in {timeFormat('%Y')(accessors.xAccessor(tooltipData.datumByKey['Frequency'].datum))}
            </div>
            <div className='text-md text-opacity-50 text-black'>
              {pluralize('action', accessors.yAccessor(tooltipData.datumByKey['Cumulative'].datum), true)} since {timeFormat('%Y')(minDate)}
            </div>
            {/* <div>
              <span>between {timeFormat('%Y')(minDate)} — {timeFormat('%Y')(new Date(accessors.xAccessor(tooltipData.nearestDatum.datum)))}</span>
              <span>in {timeFormat('%Y')(new Date(accessors.xAccessor(tooltipData.nearestDatum.datum)))}</span>
            </div> */}
          </> : null}
        </div>
      }
    />
    </XYChart>
  )
}