import { Company } from '@/payload-types'
import { useCompanyFilter } from '@/utils/global-state'
import Link from 'next/link'
import { Building } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { getSlug } from '@/utils/payloadPath'

export function CompanyLabel({ company, link }: { company: Company; link?: boolean | 'soft' }) {
  if (link) {
    if (link === 'soft') {
      return <SoftLinkCompanyLabel company={company} />
    }
    return (
      <Link href={company.path || '/'} className="link">
        <RenderedCompanyLabel company={company} />
      </Link>
    )
  } else {
    return <RenderedCompanyLabel company={company} />
  }
}

export function SoftLinkCompanyLabel({ company }: { company: Company }) {
  const [_, setCompanyFilter] = useCompanyFilter()
  return (
    <div onClick={() => setCompanyFilter(getSlug('companies', company))} className="cursor-pointer">
      <RenderedCompanyLabel company={company} textClassName="link" />
    </div>
  )
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
