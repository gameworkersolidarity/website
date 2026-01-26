import useSWR from 'swr'
import dynamic from 'next/dynamic'
const FrequencyChart = dynamic(() => import('./FrequencyChart').then((mod) => mod.FrequencyChart), {
  ssr: false,
})
import { payloadClient } from '@/utils/payload'
import { Category, Action } from '@/payload-types'
import { ActionFilterContextProvider } from './ActionFilterContextProvider'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { getCSSVariable } from '@/utils/css'
import { useCallback, useMemo } from 'react'
import { ActionInitiator } from '@/collections/enums'
import { getRelatedObjects } from '@/utils/getRelatedObjects'

export const ActionHistogramContext = ({ action }: { action: Action }) => {
  const actions = useSWR('all-actions', () =>
    payloadClient.find({ collection: 'actions', pagination: false, depth: 0, sort: '-date' }),
  )

  const [elementRef, size] = useElementSize()

  const actionType = useMemo(() => {
    if (
      action.initiator === ActionInitiator.BOSS_LED ||
      action.categories?.some((category) => (category as Category).slug === 'redundancy')
    ) {
      return 'Redundancies'
    } else if (action.initiator === ActionInitiator.WORKER_LED) {
      return 'Worker actions'
    }
    return 'Other actions'
  }, [action])

  const actionFilter = useCallback(
    (candidate: Action) => {
      if (actionType === 'Redundancies') {
        return !!(
          candidate.initiator === ActionInitiator.BOSS_LED ||
          candidate.categories?.some((category) => (category as Category).slug === 'redundancy')
        )
      } else if (actionType === 'Worker actions') {
        return !!(candidate.initiator === ActionInitiator.WORKER_LED)
      }
      return true
    },
    [actionType],
  )

  const relatedObjects = useMemo(
    () => getRelatedObjects(actions.data?.docs || []),
    [actions.data?.docs],
  )

  if (actions.isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="rounded-xl">
      <h2 className="text-sm text-zinc-500 font-semibold mb-2">{actionType} timeline</h2>
      <div ref={elementRef} className="h-[200px] w-full">
        <ActionFilterContextProvider
          actions={actions.data?.docs || []}
          countries={relatedObjects.countries}
          categories={relatedObjects.categories}
          companies={relatedObjects.companies}
          organisingGroups={relatedObjects.organisingGroups}
          campaigns={relatedObjects.campaigns}
        >
          <FrequencyChart
            size={size}
            color={
              actionType === 'Redundancies'
                ? getCSSVariable(`--color-gw-orange`, true)
                : getCSSVariable(`--color-gw-blue`, true)
            }
            highlightDate={new Date(action.date)}
            actionFilter={actionFilter}
            highlightColor={getCSSVariable(`--color-snot-500`, true)}
            countBy={actionType === 'Redundancies' ? 'headcount' : 'actions'}
          />
        </ActionFilterContextProvider>
      </div>
    </div>
  )
}
