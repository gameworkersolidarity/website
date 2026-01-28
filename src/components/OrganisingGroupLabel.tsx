import { Media, OrganisingGroup } from '@/payload-types'
import { useOrganisingGroupFilter } from '@/utils/global-state'
import Link from 'next/link'
import Image from 'next/image'
import { Users } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { getSlug } from '@/utils/payloadPath'
import { getMediaUrl } from '@/utils/media'

export function OrganisingGroupLabel({
  organisingGroup,
  link,
  logo = 18,
  className,
}: {
  organisingGroup: OrganisingGroup
  link?: boolean | 'soft'
  logo?: boolean | number
  className?: string
}) {
  if (link === 'soft') {
    return <SoftLinkOrganisingGroupLabel organisingGroup={organisingGroup} logo={logo} />
  } else if (link) {
    return (
      <Link href={organisingGroup.path || '/'}>
        <RenderedOrganisingGroupLabel
          organisingGroup={organisingGroup}
          textClassName={twMerge('link', className)}
          logo={logo}
        />
      </Link>
    )
  } else {
    return (
      <RenderedOrganisingGroupLabel
        organisingGroup={organisingGroup}
        textClassName={className}
        logo={logo}
      />
    )
  }
}

export function SoftLinkOrganisingGroupLabel({
  organisingGroup,
  logo,
}: {
  logo?: boolean | number
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
      <RenderedOrganisingGroupLabel
        organisingGroup={organisingGroup}
        textClassName="link"
        logo={logo}
      />
    </div>
  )
}

export function RenderedOrganisingGroupLabel({
  organisingGroup,
  textClassName,
  logo,
}: {
  organisingGroup: OrganisingGroup
  textClassName?: string
  logo?: boolean | number
}) {
  const logoUrl = getMediaUrl(organisingGroup.logo as Media)

  return (
    <span className="flex items-center gap-1 wrap-anywhere" key={organisingGroup.id}>
      {!!logo && logoUrl ? (
        <Image
          suppressHydrationWarning
          src={logoUrl}
          alt={(organisingGroup.logo as Media).alt || `${organisingGroup.name} logo`}
          width={typeof logo === 'number' ? logo : 16}
          height={typeof logo === 'number' ? logo : 16}
          className="object-contain shrink-0"
        />
      ) : (
        <Users className={twMerge('text-gray-500', 'w-3 h-3')} />
      )}
      <span className={textClassName}>{organisingGroup.name}</span>
    </span>
  )
}
