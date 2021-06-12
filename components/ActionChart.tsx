import {
  Axis,
  Grid,
  BarSeries,
  XYChart,
  Tooltip,
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

export function CumulativeMovementChart ({ data, cumulative }: { data: SolidarityAction[], cumulative?: boolean }) {
  const actionDates = data.map(d => new Date(d.fields.Date))
  const minDate = min([new Date('2000-01-01'), ...actionDates])
  const maxDate = new Date()

  return (
    <div className='bg-gray-900 text-gray-700 rounded-md overflow-hidden p-4 pb-0 flex flex-col justify-center text-center align-center' style={{ maxHeight: 350, height: '80vh' }}>
      <ParentSize>{(parent) => (
        <>
          <h3 className='text-lg block text-left text-gray-500 mb-3'>
            {cumulative ? 'Accumulating momentum of actions' : 'Actions per year'}
          </h3>
          <CumulativeChart
            data={data}
            minDate={minDate}
            maxDate={maxDate}
            cumulative={cumulative}
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
  cumulative,
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

  const binnedData = useMemo(() => {
    let d = binFn(data)
    for(var i = 0; i < d.length; i++) {
      if (cumulative) {
        d[i]['y'] = d[i].length + (d?.[i-1]?.['y'] || 0)
      } else {
        d[i]['y'] = d[i].length || 0
      }
    }
    return d
  }, [data, cumulative])

  const isSmallScreen = !useMediaQuery(up('sm'))

  return (
    <XYChart
      width={width}
      height={height}
      xScale={{ type: 'band' }}
      yScale={{ type: 'linear' }}
      margin={{ left: 20, right: 20, bottom: 90, top: 0 }}
    >
    <Axis
      orientation="bottom"
      tickFormat={timeFormat(isSmallScreen ? "%y" : "%Y")}
    />
    <Grid columns={false}
      lineStyle={tw`stroke-current text-gray-800`}
    />
    <BarSeries
      dataKey="Solidarity Actions"
      data={binnedData as any} {...accessors}
      colorAccessor={d => theme`colors.gray.400`}
    />
    <Tooltip<Datum>
      snapTooltipToDatumX
      snapTooltipToDatumY
      showVerticalCrosshair
      showSeriesGlyphs
      renderTooltip={({ tooltipData, colorScale }) => (
        <div className='text-md font-mono'>
          <div className='text-lg'>{pluralize('action', accessors.yAccessor(tooltipData.nearestDatum.datum), true)}</div>
          <div className='text-gray-500'>
            {cumulative
              ? <span>between {timeFormat('%Y')(minDate)} — {timeFormat('%Y')(new Date(accessors.xAccessor(tooltipData.nearestDatum.datum)))}</span>
              : <span>in {timeFormat('%Y')(new Date(accessors.xAccessor(tooltipData.nearestDatum.datum)))}</span>
            }
          </div>
        </div>
      )}
    />
    </XYChart>
  )
}