import { Campaign } from '@/payload-types'
import { useCampaignFilter } from '@/utils/global-state'
import { getSlug } from '@/utils/payloadPath'
import Emoji from 'a11y-react-emoji'
import Link from 'next/link'
import { twMerge } from 'tailwind-merge'

export function CampaignLabel({
  campaign,
  link,
  className,
}: {
  campaign: Campaign
  link?: boolean | 'soft'
  className?: string
}) {
  if (link === 'soft') {
    return <SoftLinkCampaignLabel campaign={campaign} />
  } else if (link) {
    return (
      <Link href={campaign.path || '/'}>
        <RenderedCampaignLabel campaign={campaign} textClassName={twMerge('link', className)} />
      </Link>
    )
  } else {
    return <RenderedCampaignLabel campaign={campaign} textClassName={className} />
  }
}

export function SoftLinkCampaignLabel({ campaign }: { campaign: Campaign }) {
  const [currentFilter, setCampaignFilter] = useCampaignFilter()
  const slug = getSlug('campaigns', campaign)
  return (
    <div
      onClick={() => {
        const current = currentFilter || []
        const isSelected = current.includes(slug)
        if (isSelected) {
          setCampaignFilter(
            current.filter((s) => s !== slug).length > 0 ? current.filter((s) => s !== slug) : null,
          )
        } else {
          setCampaignFilter([...current, slug])
        }
      }}
      className="cursor-pointer"
    >
      <RenderedCampaignLabel campaign={campaign} textClassName="link" />
    </div>
  )
}

export function RenderedCampaignLabel({
  campaign,
  textClassName,
}: {
  campaign: Campaign
  textClassName?: string
}) {
  return (
    <span className="flex items-center gap-1 nowrap" key={campaign.id}>
      {!!campaign.emoji && <Emoji symbol={campaign.emoji || ''} />}
      <span className={textClassName}>{campaign.name}</span>
    </span>
  )
}
