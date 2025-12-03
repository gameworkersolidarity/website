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
  const [_, setOrganisingGroupFilter] = useOrganisingGroupFilter()
  if (link === 'soft') {
    return (
      <div
        onClick={() => setOrganisingGroupFilter(getSlug('organisingGroups', organisingGroup))}
        className="cursor-pointer"
      >
        <RenderedOrganisingGroupLabel organisingGroup={organisingGroup} textClassName="link" />
      </div>
    )
  } else if (link) {
    return (
      <Link href={organisingGroup.path!}>
        <RenderedOrganisingGroupLabel organisingGroup={organisingGroup} textClassName="link" />
      </Link>
    )
  } else {
    return <RenderedOrganisingGroupLabel organisingGroup={organisingGroup} />
  }
}

export function RenderedOrganisingGroupLabel({
  organisingGroup,
  textClassName,
}: {
  organisingGroup: OrganisingGroup
  textClassName?: string
}) {
  return (
    <span className="flex items-center gap-1 nowrap" key={organisingGroup.id}>
      <Users className={twMerge('text-gray-500', 'w-3 h-3')} />
      <span className={textClassName}>{organisingGroup.name}</span>
    </span>
  )
}
