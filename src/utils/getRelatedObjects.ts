import { Event } from '@/payload-types'

export function getRelatedObjects(events: Event[]) {
  const relatedObjects: Partial<Record<keyof Event, any>> = {}
  const exampleEvent = events.filter(Boolean).slice(0, 1)[0]
  if (!exampleEvent) {
    return {}
  }
  for (const key of Object.keys(exampleEvent) as (keyof Event)[]) {
    relatedObjects[key] = getSetOfObjects(events, key as keyof Event)
  }
  return relatedObjects
}

export function getSetOfObjects(events: Event[], key: keyof Event, idKey: string = 'id') {
  const map: Map<string, any> = new Map()
  events.forEach((event) => {
    if (event[key]) {
      if (Array.isArray(event[key])) {
        event[key]?.forEach((object) => {
          map.set((object as any)[idKey], object as any)
        })
      } else {
        map.set((event[key] as any)[idKey], event[key] as any)
      }
    }
  })
  return Array.from(map.values())
}
