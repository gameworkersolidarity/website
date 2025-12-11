import { OrganisingGroup } from '@/payload-types'
import { useOrganisingGroupFilter } from '@/utils/global-state'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { getSlug } from '@/utils/payloadPath'

export function OrganisingGroupLabel({
  organisingGroup,
  link,
}: {
  organisingGroup: OrganisingGroup
  link?: boolean | 'soft'
}) {
  if (link === 'soft') {
    return <SoftLinkOrganisingGroupLabel organisingGroup={organisingGroup} />
  } else if (link) {
    return (
      <Link href={organisingGroup.path || '/'}>
        <RenderedOrganisingGroupLabel organisingGroup={organisingGroup} textClassName="link" />
      </Link>
    )
  } else {
    return <RenderedOrganisingGroupLabel organisingGroup={organisingGroup} />
  }
}

export function SoftLinkOrganisingGroupLabel({
  organisingGroup,
}: {
  organisingGroup: OrganisingGroup
}) {
  const [currentFilter, setOrganisingGroupFilter] = useOrganisingGroupFilter()
  const slug = getSlug('organisingGroups', organisingGroup)
  return (
    <div
      onClick={() => {
        const current = currentFilter || []
        const isSelected = current.includes(slug)
        if (isSelected) {
          setOrganisingGroupFilter(
            current.filter((s) => s !== slug).length > 0 ? current.filter((s) => s !== slug) : null,
          )
        } else {
          setOrganisingGroupFilter([...current, slug])
        }
      }}
      className="cursor-pointer"
    >
      <RenderedOrganisingGroupLabel organisingGroup={organisingGroup} textClassName="link" />
    </div>
  )
}

export function RenderedOrganisingGroupLabel({
  organisingGroup,
  textClassName,
}: {
  organisingGroup: OrganisingGroup
  textClassName?: string
}) {
  return (
    <span className="flex items-center gap-1 wrap-anywhere" key={organisingGroup.id}>
      <Users className={twMerge('text-gray-500', 'w-3 h-3')} />
      <span className={textClassName}>{organisingGroup.name}</span>
    </span>
  )
}
