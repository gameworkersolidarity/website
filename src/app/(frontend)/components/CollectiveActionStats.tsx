'use client'

import { EventInitiator } from '@/collections/enums'
import { useEventFilterContext } from '@/components/EventFilterContextProvider'
import { FrequencyChart } from '@/components/FrequencyChart'
import { Map } from '@/components/Map/Map'
import { getCSSVariable } from '@/utils/css'
import { useElementSize } from '@custom-react-hooks/use-element-size'

export function CollectiveActionStats({ color }: { color: string }) {
  const [elementRef, size] = useElementSize()
  const { filteredEvents, initiatorFilter } = useEventFilterContext()

  return (
    <div className="h-full grid grid-rows-3 gap-4 p-4">
      <div className="row-span-2">
        <Map
          data={filteredEvents}
          colorRange={
            initiatorFilter === EventInitiator.BOSS_LED
              ? [
                  getCSSVariable(`--color-orange-50`, true),
                  getCSSVariable(`--color-orange-200`, true),
                  getCSSVariable(`--color-gw-orange`, true),
                ]
              : [
                  getCSSVariable(`--color-blue-50`, true),
                  getCSSVariable(`--color-blue-200`, true),
                  getCSSVariable(`--color-gw-blue`, true),
                ]
          }
        />
      </div>
      <div className="bg-white rounded-xl p-2">
        <h2 className="text-xl font-bold font-identity mb-2">Events</h2>
        <div ref={elementRef} className="h-full w-full">
          <FrequencyChart size={size} color={color} />
        </div>
      </div>
    </div>
  )
}
