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

// function thresholdTime(scale) {
//   return (data, min, max) => {
//     return scale
//   };
// }

export function CumulativeMovementChart ({ data }: { data: SolidarityAction[] }) {
  const actionDates = data.map(d => new Date(d.fields.Date))
  const minDate = min([new Date('2000-01-01'), ...actionDates])
  const maxDate = new Date()

  var dateBins = timeYears(timeMonth.offset(minDate, -1), timeMonth.offset(maxDate, 1));

  const binFn = bin<SolidarityAction, Date>()
    .thresholds(dateBins)
    .value(d => new Date(d.fields.Date))
    .domain([minDate, maxDate])

  const binnedData = binFn(data)

  return (
    <div className='bg-gray-900 text-gray-700 rounded-md overflow-hidden p-4 pb-0 flex flex-col justify-center text-center align-center' style={{ maxHeight: 350, height: '80vh' }}>
      <ParentSize>{(parent) => (
        <>
          <h3 className='text-lg block text-left text-gray-500 mb-3'>
            Solidarity actions over time
          </h3>
          <CumulativeChart
            data={binnedData as any}
            width={parent.width}
            height={parent.height}
          />
        </>
      )}</ParentSize>
    </div>
  )
}

type Data = ReturnType<HistogramGeneratorNumber<SolidarityAction, number>>
type Datum = Data[0]

type AccessorFn = (d: Datum) => any

const accessors: {
  xAccessor: AccessorFn
  yAccessor: AccessorFn
} = {
  xAccessor: bin => Number(bin['x0']),
  yAccessor: bin => bin.length,
};

export function CumulativeChart ({
  data,
  height = 300,
  width = 300
}: {
  data: Data
  height: number,
  width: number
}) {
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
      data={data} {...accessors}
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
          <div className='text-gray-500'>{timeFormat('%Y')(new Date(accessors.xAccessor(tooltipData.nearestDatum.datum)))}</div>
        </div>
      )}
    />
    </XYChart>
  )
}