import { EventInitiator } from '@/collections/enums'
import { EventFilterKey, getFilterPath, useInitiatorFilter } from './global-state'
import Link from 'next/link'

export function DisplayInitiator({
  initiator,
  link,
}: {
  initiator: EventInitiator
  link?: 'soft' | boolean
}) {
  const [_, setInitiatorFilter] = useInitiatorFilter()
  if (link === 'soft') {
    return (
      <div onClick={() => setInitiatorFilter(initiator)} className="cursor-pointer">
        <RenderedInitiator initiator={initiator} />
      </div>
    )
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

function RenderedInitiator({ initiator }: { initiator: EventInitiator }) {
  switch (initiator) {
    case EventInitiator.WORKER_LED:
      return <span className="text-blue-400 font-semibold">Worker-led</span>
    case EventInitiator.BOSS_LED:
      return <span className="text-gw-orange font-semibold">Boss-led</span>
    case EventInitiator.OTHER:
      return <span className="text-gray-400 font-semibold">Other</span>
    default:
      return <span className="text-gray-400 font-semibold">All</span>
  }
}
