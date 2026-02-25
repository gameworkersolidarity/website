'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { CampaignLabel } from '@/components/CampaignLabel'
import { DraftBadge } from '@/components/DraftBadge'
import { DateTime } from '@/components/DateTime'
import { LexicalRenderer } from '@/app/(frontend)/components/LexicalRenderer'
import { Button } from '@/components/ui/button'
import { getMediaUrl } from '@/utils/media'
import { layoutTransition } from '@/lib/motion'
import type { Campaign } from '@/payload-types'

export function CampaignsGrid({
  campaigns,
  dateRanges,
}: {
  campaigns: Campaign[]
  dateRanges: Record<string, { earliestDate: Date; latestDate: Date }>
}) {
  if (campaigns.length === 0) return null

  return (
    <motion.div className="grid grid-cols-1 gap-4" layout transition={layoutTransition}>
      {campaigns.map((campaign) => {
        const featuredMedia =
          typeof campaign.featuredImage === 'object' ? campaign.featuredImage : null
        const imageUrl = featuredMedia ? getMediaUrl(featuredMedia) : null

        return (
          <motion.div key={campaign.id} layout transition={layoutTransition}>
            <Link
              href={campaign.path!}
              className="flex flex-col bg-white rounded-xl overflow-hidden"
            >
              <header className="px-4 md:px-5 pt-4 pb-0! flex flex-col gap-2">
                <h2 className="text-2xl font-bold font-identity flex items-center gap-2 flex-wrap">
                  <CampaignLabel campaign={campaign} />
                  {campaign._status === 'draft' && <DraftBadge />}
                </h2>
                {dateRanges[campaign.id] && (
                  <div className="flex flex-row gap-1">
                    <DateTime date={dateRanges[campaign.id].earliestDate} />
                    <span>to</span>
                    <DateTime date={dateRanges[campaign.id].latestDate} />
                  </div>
                )}
              </header>
              {imageUrl && typeof campaign.featuredImage === 'object' && (
                <Image
                  src={imageUrl}
                  alt={campaign.name || ''}
                  width={featuredMedia?.width || 1000}
                  height={featuredMedia?.height || 1000}
                  objectFit="cover"
                  className="w-full h-60 object-cover overflow-hidden my-3"
                />
              )}
              <div className="px-4 md:px-5 space-y-3 pb-4">
                {campaign.description && (
                  <LexicalRenderer content={campaign.description} limitParagraphs={1} />
                )}
                <Button variant="outline">Read more</Button>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
