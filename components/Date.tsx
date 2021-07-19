import { format as formatDate } from 'date-fns';

export function DateTime ({ date, format = 'dd MMM yyyy' }: { date: string | Date, format?: string }) {
  const _date = new Date(date)
  return (
    <time dateTime={formatDate(_date, 'yyyy-MM-dd')}>
      {formatDate(_date, format)}
    </time>
  )
}