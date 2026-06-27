import { Category } from '@/payload-types'
import { useCategoryFilter } from '@/utils/global-state'
import { getSlug } from '@/utils/payloadPath'
import Emoji from 'a11y-react-emoji'
import Link from 'next/link'
import { twMerge } from 'tailwind-merge'

export function CategoryLabel({
  category,
  link,
  className,
}: {
  category: Category
  link?: boolean | 'soft'
  className?: string
}) {
  if (link === 'soft') {
    return <SoftLinkCategoryLabel category={category} />
  } else if (link) {
    return (
      <Link href={category.path || '/'}>
        <RenderedCategoryLabel category={category} textClassName={twMerge('link', className)} />
      </Link>
    )
  } else {
    return <RenderedCategoryLabel category={category} textClassName={className} />
  }
}

export function SoftLinkCategoryLabel({ category }: { category: Category }) {
  const [currentFilter, setCategoryFilter] = useCategoryFilter()
  const slug = getSlug('categories', category)
  return (
    <div
      onClick={() => {
        const current = currentFilter || []
        const isSelected = current.includes(slug)
        if (isSelected) {
          setCategoryFilter(
            current.filter((s) => s !== slug).length > 0 ? current.filter((s) => s !== slug) : null,
          )
        } else {
          setCategoryFilter([...current, slug])
        }
      }}
      className="cursor-pointer"
    >
      <RenderedCategoryLabel category={category} textClassName="link" />
    </div>
  )
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
