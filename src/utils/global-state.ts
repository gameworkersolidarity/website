import { ActionInitiator, ActionInitiatorFilter } from '@/collections/enums'
import { projectStrings } from '@/project-strings'
import { SortingState } from '@tanstack/react-table'
import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { noop } from 'lodash'
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
}

// Jotai atoms for filter state
export const countryISOA2FilterAtom = atom<string[] | null>(null)
export const categoryFilterAtom = atom<string[] | null>(null)
export const companyFilterAtom = atom<string[] | null>(null)
export const organisingGroupFilterAtom = atom<string[] | null>(null)
export const campaignFilterAtom = atom<string[] | null>(null)
export const initiatorFilterAtom = atom<ActionInitiatorFilter | null>(
  ActionInitiatorFilter.WORKER_LED,
)
export const yearFilterAtom = atom<string[] | null>(null)

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
  const [countryISOA2, setCountryISOA2] = useAtom(countryISOA2FilterAtom)
  if (override) {
    const overrideArray = Array.isArray(override) ? override : override ? [override] : null
    return [overrideArray, noop] as const
  }
  return [countryISOA2, setCountryISOA2] as const
}

export function useCategoryFilter(override?: string | string[] | null) {
  const [category, setCategory] = useAtom(categoryFilterAtom)
  if (override) {
    const overrideArray = Array.isArray(override) ? override : override ? [override] : null
    return [overrideArray, noop] as const
  }
  return [category, setCategory] as const
}

export function useCompanyFilter(override?: string | string[] | null) {
  const [company, setCompany] = useAtom(companyFilterAtom)
  if (override) {
    const overrideArray = Array.isArray(override) ? override : override ? [override] : null
    return [overrideArray, noop] as const
  }
  return [company, setCompany] as const
}

export function useOrganisingGroupFilter(override?: string | string[] | null) {
  const [organisingGroup, setOrganisingGroup] = useAtom(organisingGroupFilterAtom)
  if (override) {
    const overrideArray = Array.isArray(override) ? override : override ? [override] : null
    return [overrideArray, noop] as const
  }
  return [organisingGroup, setOrganisingGroup] as const
}

export function useCampaignFilter(override?: string | string[] | null) {
  const [campaign, setCampaign] = useAtom(campaignFilterAtom)
  if (override) {
    const overrideArray = Array.isArray(override) ? override : override ? [override] : null
    return [overrideArray, noop] as const
  }
  return [campaign, setCampaign] as const
}

export function useInitiatorFilter(override?: ActionInitiatorFilter | null) {
  const [initiator, setInitiator] = useAtom(initiatorFilterAtom)
  return override ? ([override, noop] as const) : ([initiator, setInitiator] as const)
}

export function useYearFilter(override?: string | number | string[] | number[] | null) {
  const [year, setYear] = useAtom(yearFilterAtom)
  if (override) {
    const overrideArray = Array.isArray(override)
      ? override.map((v) => String(v))
      : override
        ? [String(override)]
        : null
    return [overrideArray?.map(Number) || null, noop] as const
  }
  // Convert string array to number array for year filter
  const setYearFilter = (value: string | number | string[] | number[] | null) => {
    if (value === null) {
      setYear(null)
    } else if (Array.isArray(value)) {
      setYear(value.map((v) => String(v)))
    } else {
      setYear([String(value)])
    }
  }
  return [year?.map(Number) || null, setYearFilter] as const
}
