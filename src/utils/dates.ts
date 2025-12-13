import { differenceInDays } from 'date-fns'
import { merge } from 'lodash'

export function getDateInterval(
  dateRange: Array<Date | number>,
  overrideOptions?: Partial<typeof defaultOptions>,
) {
  if (!dateRange || dateRange.filter(Boolean).length !== 2) return 'day'
  const [start, end] = [new Date(dateRange[0]), new Date(dateRange[1])]
  const dayRange = differenceInDays(end, start)
  const options = merge(defaultOptions, overrideOptions)
  if (options.maxForDays && dayRange <= options.maxForDays) return 'day'
  if (options.maxForWeek && dayRange <= options.maxForWeek) return 'week'
  if (options.maxForMonth && dayRange <= options.maxForMonth) return 'month'
  if (options.maxForQuarter && dayRange <= options.maxForQuarter) return 'quarter'
  if (options.maxForYear && dayRange <= options.maxForYear) return 'year'
  return 'year'
}

const defaultOptions = {
  maxForDays: 21,
  maxForWeek: 180,
  maxForMonth: 365 * 2,
  maxForQuarter: 365 * 5,
  maxForYear: 365 * 10,
}
