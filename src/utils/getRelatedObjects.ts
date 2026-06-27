import { Action } from '@/payload-types'

export function getRelatedObjects(actions: Action[]) {
  const relatedObjects: Partial<Record<keyof Action, any>> = {}
  const exampleAction = actions.filter(Boolean).slice(0, 1)[0]
  if (!exampleAction) {
    return {}
  }
  for (const key of Object.keys(exampleAction) as (keyof Action)[]) {
    relatedObjects[key] = getSetOfObjects(actions, key as keyof Action)
  }
  return relatedObjects
}

export function getSetOfObjects(actions: Action[], key: keyof Action, idKey: string = 'id') {
  const map: Map<string, any> = new Map()
  actions.forEach((action) => {
    if (action[key]) {
      if (Array.isArray(action[key])) {
        action[key]?.forEach((object) => {
          map.set((object as any)[idKey], object as any)
        })
      } else {
        map.set((action[key] as any)[idKey], action[key] as any)
      }
    }
  })
  return Array.from(map.values())
}
