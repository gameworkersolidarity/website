import { format as formatDate } from 'date-fns'

export function DateTime({
  date,
  format = 'dd MMM yyyy',
}: {
  date: string | Date | null
  format?: string
}) {
  if (!date) return null
  try {
    const _date = new Date(date)
    return <time dateTime={formatDate(_date, 'yyyy-MM-dd')}>{formatDate(_date, format)}</time>
  } catch (error) {
    return <time dateTime={date.toString()}>{date.toString()}</time>
  }
}
