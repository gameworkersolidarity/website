import { Campaign } from '@/payload-types'
import { useCampaignFilter } from '@/utils/global-state'
import { getSlug } from '@/utils/payloadPath'
import Emoji from 'a11y-react-emoji'
import Link from 'next/link'

export function CampaignLabel({ campaign, link }: { campaign: Campaign; link?: boolean | 'soft' }) {
  if (link === 'soft') {
    return <SoftLinkCampaignLabel campaign={campaign} />
  } else if (link) {
    return (
      <Link href={campaign.path!}>
        <RenderedCampaignLabel campaign={campaign} textClassName="link" />
      </Link>
    )
  } else {
    return <RenderedCampaignLabel campaign={campaign} />
  }
}

export function SoftLinkCampaignLabel({ campaign }: { campaign: Campaign }) {
  const [_, setCampaignFilter] = useCampaignFilter()
  return (
    <div
      onClick={() => setCampaignFilter(getSlug('campaigns', campaign))}
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
