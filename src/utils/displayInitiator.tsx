import { ActionInitiatorFilter } from '@/collections/enums'
import { ActionFilterKey, getFilterPath, useInitiatorFilter } from './global-state'
import Link from 'next/link'

export function DisplayInitiator({
  initiator,
  link,
}: {
  initiator: ActionInitiatorFilter
  link?: 'soft' | boolean
}) {
  if (link === 'soft') {
    return <SoftLinkInitiator initiator={initiator} />
  } else if (link) {
    return (
      <Link href={getFilterPath({ [ActionFilterKey.Initiator]: initiator })}>
        <RenderedInitiator initiator={initiator} />
      </Link>
    )
  } else {
    return <RenderedInitiator initiator={initiator} />
  }
}

function SoftLinkInitiator({ initiator }: { initiator: ActionInitiatorFilter }) {
  const [_, setInitiatorFilter] = useInitiatorFilter()
  return (
    <div onClick={() => setInitiatorFilter(initiator)} className="cursor-pointer">
      <RenderedInitiator initiator={initiator} />
    </div>
  )
}

function RenderedInitiator({ initiator }: { initiator: ActionInitiatorFilter }) {
  switch (initiator) {
    case ActionInitiatorFilter.WORKER_LED:
      return <span className="text-blue-400 font-semibold">Worker-led</span>
    case ActionInitiatorFilter.BOSS_LED:
      return <span className="text-gw-orange font-semibold">Boss-led</span>
    case ActionInitiatorFilter.OTHER:
      return <span className="text-gray-400 font-semibold">Other</span>
    default:
      return <span className="text-gray-400 font-semibold">All</span>
  }
}
