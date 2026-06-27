import { OrganisingGroup } from '@/payload-types'
import { OrganisingGroupLabel } from './OrganisingGroupLabel'
import Link from 'next/link'
import { OrganisingGroupLinks } from '@/app/(frontend)/organising-groups/[slug]/OrganisingGroupPage'
import { twMerge } from 'tailwind-merge'
import { DraftBadge } from '@/components/DraftBadge'

export function OrganisingGroupCard({
  group,
  className,
}: {
  group: OrganisingGroup
  className?: string
}) {
  return (
    <div className={twMerge('bg-white rounded-xl p-4', className)}>
      <Link href={group.path!}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold flex items-center gap-2 flex-wrap">
              <OrganisingGroupLabel organisingGroup={group} link logo={36} />
              {group._status === 'draft' && <DraftBadge />}
            </div>
            {group.fullName && <div className="text-sm text-gray-600 mt-1">{group.fullName}</div>}
          </div>
        </div>
      </Link>
      {!!(group.website || group.twitter || group.bluesky) && (
        <div className="text-sm text-gray-600 mt-1">
          <OrganisingGroupLinks page={group} />
        </div>
      )}
    </div>
  )
}
