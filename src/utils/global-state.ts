import { ActionInitiatorFilter } from '@/collections/enums'
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

export enum ActionFilterKey {
  Country = 'country',
  Category = 'category',
  Company = 'company',
  OrganisingGroup = 'organisingGroup',
  Campaign = 'campaign',
  Initiator = 'initiator',
  Year = 'year',
  SearchQuery = 'text',
}

export function getFilterPath(
  filter: { [key in ActionFilterKey]?: string | number },
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
    ActionFilterKey.Country,
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
    ActionFilterKey.Category,
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
    ActionFilterKey.Company,
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
    ActionFilterKey.OrganisingGroup,
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
    ActionFilterKey.Campaign,
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

export function useInitiatorFilter(override?: ActionInitiatorFilter | null) {
  const [initiator, setInitiator] = useQueryState(
    ActionFilterKey.Initiator,
    parseAsStringEnum(Object.values(ActionInitiatorFilter)).withOptions({
      clearOnDefault: true,
    }),
  )
  return override ? ([override, noop] as const) : ([initiator, setInitiator] as const)
}

export function useYearFilter(override?: string | number | string[] | number[] | null) {
  const [year, setYear] = useQueryState(
    ActionFilterKey.Year,
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

export function useSearchQueryFilter() {
  const [searchQuery, setSearchQuery] = useQueryState(
    ActionFilterKey.SearchQuery,
    parseAsString.withOptions({
      clearOnDefault: true,
    }),
  )
  return [searchQuery, setSearchQuery] as const
}
