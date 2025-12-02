import { EventInitiator } from '@/collections/enums'

export function DisplayInitiator({ initiator }: { initiator: EventInitiator }) {
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
