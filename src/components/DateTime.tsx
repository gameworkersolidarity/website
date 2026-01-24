'use client'

import { format as formatDate } from 'date-fns'
import { ErrorBoundary } from 'next/dist/client/components/error-boundary'

export function DateTime({
  date,
  format = 'dd MMM yyyy',
}: {
  date: string | Date | null
  format?: string
}) {
  if (!date) return null

  return (
    <ErrorBoundary errorComponent={() => <time dateTime={date.toString()}>{date.toString()}</time>}>
      <_DateTime date={date} format={format} />
    </ErrorBoundary>
  )
}

function _DateTime({
  date,
  format = 'dd MMM yyyy',
}: {
  date: string | Date | null
  format?: string
}) {
  if (!date) return null
  const _date = new Date(date)
  return <time dateTime={formatDate(_date, 'yyyy-MM-dd')}>{formatDate(_date, format)}</time>
}
