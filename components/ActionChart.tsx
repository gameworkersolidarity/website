import { ParentSize } from '@visx/responsive';
import {
  Axis,
  BarSeries, ThemeContext, XYChart
} from '@visx/xychart';
import { bin, HistogramGeneratorNumber } from "d3-array";
import { timeMonth, timeMonths, timeYears } from 'd3-time';
import { timeFormat } from 'd3-time-format';
import { min } from 'date-fns';
import { useMemo } from 'react';
import { theme } from 'twin.macro';
import { SolidarityAction } from '../data/types';
import { useMediaQuery } from '../utils/mediaQuery';
import { up } from '../utils/screens';

export function CumulativeMovementChart ({ data, onSelectYear }: { data: SolidarityAction[], cumulative?: boolean, onSelectYear?: (year: string) => void }) {
  const actionDates = data.map(d => new Date(d.fields.Date))
  const minDate = min([new Date('2000-01-01'), ...actionDates])
  const maxDate = new Date()

  return (
    <div className='relative cursor-pointer action-chart' style={{ height: 120, maxHeight: '25vh' }}>
      <ParentSize>{(parent) => (
        <>
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

  const createBinFn = (dateBins: Date[]) => {
    return  bin<SolidarityAction, Date>()
      .thresholds(dateBins)
      .value(d => new Date(d.fields.Date))
      .domain([minDate, maxDate])
  }

  const yearBinFn = createBinFn(yearBins)

  const binnedData = useMemo(() => {
    let d = yearBinFn(data)
    for(var i = 0; i < d.length; i++) {
      d[i]['y'] = d[i].length || 0
    }
    return d
  }, [data])

  const isSmallScreen = !useMediaQuery(up('xl'))

  return (
    <ThemeContext.Provider value={{
      backgroundColor: 'transparent',
      colors: [theme`colors.gwPink`],
      axisStyles: {
        x: {
          // @ts-ignore
          bottom: {
            axisLine: {
              stroke: theme`colors.gray.400`
            },
            tickLine: {
              stroke: 'transparent'
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
      <BarSeries
        dataKey="Frequency"
        data={binnedData as any} {...accessors}
        onPointerUp={(e) => {
          onSelectYear?.(timeFormat('%Y')(accessors.xAccessor(e.datum)))
        }}
      />
      <Axis
        orientation="bottom"
        tickFormat={timeFormat(isSmallScreen ? "%y" : "%Y")}
      />
      </XYChart>
    </ThemeContext.Provider>
  )
}