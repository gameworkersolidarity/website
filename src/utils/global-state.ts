import { EventInitiator } from '@/collections/enums'
import { projectStrings } from '@/project-strings'
import { SortingState } from '@tanstack/react-table'
import { atomWithStorage } from 'jotai/utils'
import { noop } from 'lodash'
import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import qs from 'query-string'

export enum ZoomLevel {
  Timeline = 'timeline',
  Compact = 'compact',
  Preview = 'preview',
  Detailed = 'detailed',
}

export const sortOrderAtom = atomWithStorage<SortingState>('sortOrder', [
  {
    id: 'date',
    desc: true,
  },
])

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
  keepExistingPath: boolean = false,
) {
  const url = new URL(
    keepExistingPath && typeof document !== 'undefined'
      ? document.location.href
      : projectStrings.baseUrl,
  )
  if (!keepExistingQuery) {
    url.searchParams.forEach((value, key) => {
      url.searchParams.delete(key)
    })
  }
  return qs.stringifyUrl({
    url: url.toString(),
    query: filter,
  })
}

export function useCountryISOA2Filter(override?: string | string[] | null) {
  const [countryISOA2, setCountryISOA2] = useQueryState(
    EventFilterKey.Country,
    parseAsArrayOf(parseAsString).withOptions({
      clearOnDefault: true,
    }),
  )
  if (override) {
    const overrideArray = Array.isArray(override) ? override : override ? [override] : null
    return [overrideArray, noop] as const
  }
  return [countryISOA2, setCountryISOA2] as const
}

export function useCategoryFilter(override?: string | string[] | null) {
  const [category, setCategory] = useQueryState(
    EventFilterKey.Category,
    parseAsArrayOf(parseAsString).withOptions({
      clearOnDefault: true,
    }),
  )
  if (override) {
    const overrideArray = Array.isArray(override) ? override : override ? [override] : null
    return [overrideArray, noop] as const
  }
  return [category, setCategory] as const
}

export function useCompanyFilter(override?: string | string[] | null) {
  const [company, setCompany] = useQueryState(
    EventFilterKey.Company,
    parseAsArrayOf(parseAsString).withOptions({
      clearOnDefault: true,
    }),
  )
  if (override) {
    const overrideArray = Array.isArray(override) ? override : override ? [override] : null
    return [overrideArray, noop] as const
  }
  return [company, setCompany] as const
}

export function useOrganisingGroupFilter(override?: string | string[] | null) {
  const [organisingGroup, setOrganisingGroup] = useQueryState(
    EventFilterKey.OrganisingGroup,
    parseAsArrayOf(parseAsString).withOptions({
      clearOnDefault: true,
    }),
  )
  if (override) {
    const overrideArray = Array.isArray(override) ? override : override ? [override] : null
    return [overrideArray, noop] as const
  }
  return [organisingGroup, setOrganisingGroup] as const
}

export function useCampaignFilter(override?: string | string[] | null) {
  const [campaign, setCampaign] = useQueryState(
    EventFilterKey.Campaign,
    parseAsArrayOf(parseAsString).withOptions({
      clearOnDefault: true,
    }),
  )
  if (override) {
    const overrideArray = Array.isArray(override) ? override : override ? [override] : null
    return [overrideArray, noop] as const
  }
  return [campaign, setCampaign] as const
}

export function useInitiatorFilter(override?: EventInitiator | null) {
  const [initiator, setInitiator] = useQueryState(
    EventFilterKey.Initiator,
    parseAsStringEnum<EventInitiator>(Object.values(EventInitiator))
      .withOptions({
        clearOnDefault: true,
      })
      .withDefault(EventInitiator.WORKER_LED),
  )
  return override ? ([override, noop] as const) : ([initiator, setInitiator] as const)
}

export function useYearFilter(override?: string | number | string[] | number[] | null) {
  const [year, setYear] = useQueryState(
    EventFilterKey.Year,
    parseAsArrayOf(parseAsString).withOptions({
      clearOnDefault: true,
    }),
  )
  if (override) {
    const overrideArray = Array.isArray(override)
      ? override.map((v) => String(v))
      : override
        ? [String(override)]
        : null
    return [overrideArray?.map(Number) || null, noop] as const
  }
  return [year?.map(Number) || null, setYear] as const
}
