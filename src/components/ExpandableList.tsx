import { useState } from 'react'
import { Button } from './ui/button'
import { ArrowDown, ArrowUp } from 'lucide-react'
import pluralize from 'pluralize'

export function ExpandableList<T extends { id: string }>({
  items,
  defaultCount,
  renderItem,
  noun,
  className,
}: {
  items: T[]
  defaultCount: number
  renderItem: (item: T) => React.ReactNode
  noun: string
  className?: string
}) {
  const [displayedCount, setDisplayedCount] = useState(defaultCount)
  return (
    <ul className={className}>
      {items.slice(0, displayedCount).map(renderItem)}
      {items.length > defaultCount && (
        <Button
          variant="outline"
          onClick={() => {
            return displayedCount < items.length
              ? setDisplayedCount(items.length)
              : setDisplayedCount(defaultCount)
          }}
        >
          <>
            <span className="pr-1">
              Show{' '}
              {displayedCount < items.length
                ? pluralize(noun, items.length - displayedCount, true)
                : ''}{' '}
              {displayedCount < items.length ? 'more' : 'fewer'}
            </span>{' '}
            {displayedCount < items.length ? (
              <ArrowDown className="size-4" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </>
        </Button>
      )}
    </ul>
  )
}
