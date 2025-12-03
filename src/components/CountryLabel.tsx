import { Country } from '@/payload-types'
import { useCountryISOA2Filter } from '@/utils/global-state'
import Emoji from 'a11y-react-emoji'
import Link from 'next/link'
import { getSlug } from '@/utils/payloadPath'

export function CountryLabel({ country, link }: { country: Country; link?: boolean | 'soft' }) {
  const [_, setCountryISOA2Filter] = useCountryISOA2Filter()
  if (link === 'soft') {
    return (
      <div onClick={() => setCountryISOA2Filter(country.isoA2)} className="cursor-pointer">
        <RenderedCountryLabel country={country} textClassName="link" />
      </div>
    )
  } else if (link) {
    return (
      <Link href={country.path!}>
        <RenderedCountryLabel country={country} textClassName="link" />
      </Link>
    )
  } else {
    return <RenderedCountryLabel country={country} />
  }
}

export function RenderedCountryLabel({
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

// import { EventInitiator } from '@/collections/enums'

// export function DisplayInitiator({ initiator }: { initiator: EventInitiator }) {
//   switch (initiator) {
//     case EventInitiator.WORKER_LED:
//       return <span className="text-blue-400 font-semibold">Worker-led</span>
//     case EventInitiator.BOSS_LED:
//       return <span className="text-gw-orange font-semibold">Boss-led</span>
//     case EventInitiator.OTHER:
//       return <span className="text-gray-400 font-semibold">Other</span>
//     default:
//       return <span className="text-gray-400 font-semibold">All</span>
//   }
// }
