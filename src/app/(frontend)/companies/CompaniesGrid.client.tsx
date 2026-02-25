'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { DraftBadge } from '@/components/DraftBadge'
import { layoutTransition } from '@/lib/motion'
import type { Company } from '@/payload-types'

type Item = { company: Company; actionCount: number }

export function CompaniesGrid({ items }: { items: Item[] }) {
  if (items.length === 0) return null

  return (
    <motion.div
      className="grid"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1.5rem',
      }}
      layout
      transition={layoutTransition}
    >
      {items.map(({ company, actionCount }) => (
        <motion.div key={company.id} layout transition={layoutTransition}>
          <Link
            href={company.path!}
            className="block p-6 border border-gray-200 rounded-lg no-underline text-inherit transition-shadow hover:shadow-md"
          >
            <h2 className="text-xl font-semibold mb-3 text-[#4A90E2] flex items-center gap-2 flex-wrap">
              {company.name}
              {company._status === 'draft' && <DraftBadge />}
            </h2>
            <div className="text-sm text-gray-600">
              {actionCount > 0 && (
                <p className="m-0 mb-1">
                  {actionCount} action{actionCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
