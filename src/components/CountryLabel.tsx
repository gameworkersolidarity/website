import { Country } from '@/payload-types'
import { useCountryISOA2Filter } from '@/utils/global-state'
import Emoji from 'a11y-react-emoji'
import Link from 'next/link'
import { twMerge } from 'tailwind-merge'

export function CountryLabel({
  country,
  link,
  className,
}: {
  country: Country
  link?: boolean | 'soft'
  className?: string
}) {
  if (link === 'soft') {
    return <SoftLinkCountryLabel country={country} />
  } else if (link) {
    return (
      <Link href={country.path || '/'}>
        <RenderedCountryLabel country={country} textClassName={twMerge('link', className)} />
      </Link>
    )
  } else {
    return <RenderedCountryLabel country={country} textClassName={className} />
  }
}

function SoftLinkCountryLabel({ country }: { country: Country }) {
  const [currentFilter, setCountryISOA2Filter] = useCountryISOA2Filter()
  return (
    <div
      onClick={() => {
        const current = currentFilter || []
        const isSelected = current.includes(country.isoA2)
        if (isSelected) {
          setCountryISOA2Filter(
            current.filter((s) => s !== country.isoA2).length > 0
              ? current.filter((s) => s !== country.isoA2)
              : null,
          )
        } else {
          setCountryISOA2Filter([...current, country.isoA2])
        }
      }}
      className="cursor-pointer"
    >
      <RenderedCountryLabel country={country} textClassName="link" />
    </div>
  )
}

function RenderedCountryLabel({
  country,
  textClassName,
}: {
  country: Country
  textClassName?: string
}) {
  return (
    <span className="flex items-center gap-1 nowrap" key={country.id}>
      <Emoji symbol={country.emoji || ''} label={`Flag of ${country.name}`} />
      <span className={textClassName}>{country.name}</span>
    </span>
  )
}
