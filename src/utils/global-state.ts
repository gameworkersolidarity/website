import { EventInitiator } from '@/collections/enums'
import { SortingState } from '@tanstack/react-table'
import { useAtom } from 'jotai/react'
import { atomWithStorage } from 'jotai/utils'
import { noop } from 'lodash'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import qs from 'query-string'

export enum ZoomLevel {
  Compact = 'compact',
  Preview = 'preview',
  Detailed = 'detailed',
}

export const zoomLevelAtom = atomWithStorage<ZoomLevel>('zoomLevel', ZoomLevel.Compact)

export const sortOrderAtom = atomWithStorage<SortingState>('sortOrder', [
  {
    id: 'date',
    desc: false,
  },
])

export function useZoomLevel() {
  return useAtom(zoomLevelAtom)
}

export enum EventFilterKey {
  Country = 'country',
  Category = 'category',
  Company = 'company',
  OrganisingGroup = 'organisingGroup',
  Campaign = 'campaign',
  Initiator = 'initiator',
  Year = 'year',
}

export function getFilterPath(
  filter: { [key in EventFilterKey]?: string | number },
  keepExistingQuery: boolean = true,
) {
  return qs.stringifyUrl({
    url: keepExistingQuery && typeof document !== 'undefined' ? document.location.href : '/',
    query: filter,
  })
}

export function useCountryISOA2Filter(override?: string | null) {
  const [countryISOA2, setCountryISOA2] = useQueryState(EventFilterKey.Country, {
    clearOnDefault: true,
  })
  return override ? ([override, noop] as const) : ([countryISOA2, setCountryISOA2] as const)
}

export function useCategoryFilter(override?: string | null) {
  const [category, setCategory] = useQueryState(EventFilterKey.Category, { clearOnDefault: true })
  return override ? ([override, noop] as const) : ([category, setCategory] as const)
}

export function useCompanyFilter(override?: string | null) {
  const [company, setCompany] = useQueryState(EventFilterKey.Company, { clearOnDefault: true })
  return override ? ([override, noop] as const) : ([company, setCompany] as const)
}

export function useOrganisingGroupFilter(override?: string | null) {
  const [organisingGroup, setOrganisingGroup] = useQueryState(EventFilterKey.OrganisingGroup, {
    clearOnDefault: true,
  })
  return override ? ([override, noop] as const) : ([organisingGroup, setOrganisingGroup] as const)
}

export function useCampaignFilter(override?: string | null) {
  const [campaign, setCampaign] = useQueryState(EventFilterKey.Campaign, { clearOnDefault: true })
  return override ? ([override, noop] as const) : ([campaign, setCampaign] as const)
}

export function useInitiatorFilter(override?: EventInitiator | null) {
  const [initiator, setInitiator] = useQueryState(
    EventFilterKey.Initiator,
    parseAsStringEnum<EventInitiator>(Object.values(EventInitiator)).withOptions({
      clearOnDefault: true,
    }),
  )
  return override ? ([override, noop] as const) : ([initiator, setInitiator] as const)
}

export function useYearFilter(override?: string | number | null) {
  const [year, setYear] = useQueryState(EventFilterKey.Year, { clearOnDefault: true })
  return override ? ([override, noop] as const) : ([Number(year), setYear] as const)
}
