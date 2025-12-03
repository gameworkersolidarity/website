import { Company } from '@/payload-types'
import { EventFilterKey, getFilterPath, useCompanyFilter } from '@/utils/global-state'
import Link from 'next/link'
import { Building } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { getSlug } from '@/utils/payloadPath'

export function CompanyLabel({ company, link }: { company: Company; link?: boolean | 'soft' }) {
  const [_, setCompanyFilter] = useCompanyFilter()
  if (link) {
    if (link === 'soft') {
      return (
        <div
          onClick={() => setCompanyFilter(getSlug('companies', company))}
          className="cursor-pointer"
        >
          <RenderedCompanyLabel company={company} textClassName="link" />
        </div>
      )
    }
    return (
      <Link href={company.path!} className="link">
        <RenderedCompanyLabel company={company} textClassName="link" />
      </Link>
    )
  } else {
    return <RenderedCompanyLabel company={company} />
  }
}

export function RenderedCompanyLabel({
  company,
  textClassName,
}: {
  company: Company
  textClassName?: string
}) {
  return (
    <span className="flex items-center gap-1 nowrap" key={company.id}>
      <Building className={twMerge('text-gray-500', 'w-3 h-3')} />
      <span className={textClassName}>{company.name}</span>
    </span>
  )
}
