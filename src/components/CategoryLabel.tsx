import { Category } from '@/payload-types'
import { EventFilterKey, getFilterPath, useCategoryFilter } from '@/utils/global-state'
import { getSlug } from '@/utils/payloadPath'
import Emoji from 'a11y-react-emoji'
import Link from 'next/link'
import { twMerge } from 'tailwind-merge'

export function CategoryLabel({ category, link }: { category: Category; link?: boolean | 'soft' }) {
  const [_, setCategoryFilter] = useCategoryFilter()
  if (link === 'soft') {
    return (
      <div
        onClick={() => setCategoryFilter(getSlug('categories', category))}
        className="cursor-pointer"
      >
        <RenderedCategoryLabel category={category} textClassName="link" />
      </div>
    )
  } else if (link) {
    return (
      <Link href={category.path!}>
        <RenderedCategoryLabel category={category} textClassName="link" />
      </Link>
    )
  } else {
    return <RenderedCategoryLabel category={category} />
  }
}

export function RenderedCategoryLabel({
  category,
  textClassName,
}: {
  category: Category
  textClassName?: string
}) {
  return (
    <span className="flex items-center gap-1 nowrap" key={category.id}>
      {!!category.emoji && <Emoji symbol={category.emoji || ''} />}
      <span className={twMerge('capitalize', textClassName)}>{category.name}</span>
    </span>
  )
}
