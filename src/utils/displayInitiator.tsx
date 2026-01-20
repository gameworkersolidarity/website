import { EventInitiatorFilter } from '@/collections/enums'
import { EventFilterKey, getFilterPath, useInitiatorFilter } from './global-state'
import Link from 'next/link'

export function DisplayInitiator({
  initiator,
  link,
}: {
  initiator: EventInitiatorFilter
  link?: 'soft' | boolean
}) {
  if (link === 'soft') {
    return <SoftLinkInitiator initiator={initiator} />
  } else if (link) {
    return (
      <Link href={getFilterPath({ [EventFilterKey.Initiator]: initiator })}>
        <RenderedInitiator initiator={initiator} />
      </Link>
    )
  } else {
    return <RenderedInitiator initiator={initiator} />
  }
}

function SoftLinkInitiator({ initiator }: { initiator: EventInitiatorFilter }) {
  const [_, setInitiatorFilter] = useInitiatorFilter()
  return (
    <div onClick={() => setInitiatorFilter(initiator)} className="cursor-pointer">
      <RenderedInitiator initiator={initiator} />
    </div>
  )
}

function RenderedInitiator({ initiator }: { initiator: EventInitiatorFilter }) {
  switch (initiator) {
    case EventInitiatorFilter.WORKER_LED:
      return <span className="text-blue-400 font-semibold">Worker-led</span>
    case EventInitiatorFilter.BOSS_LED:
      return <span className="text-gw-orange font-semibold">Boss-led</span>
    case EventInitiatorFilter.OTHER:
      return <span className="text-gray-400 font-semibold">Other</span>
    default:
      return <span className="text-gray-400 font-semibold">All</span>
  }
}
