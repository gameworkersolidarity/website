'use client'

import { EventInitiator } from '@/collections/enums'
import type { Campaign, Category, Company, Country, Event, OrganisingGroup } from '@/payload-types'
import {
  useCategoryFilter,
  useYearFilter,
  useOrganisingGroupFilter,
  useCompanyFilter,
  useCountryISOA2Filter,
  useCampaignFilter,
  useInitiatorFilter,
} from '@/utils/global-state'
import { payloadClient } from '@/utils/payload'
import { ArchiveBreadcrumb } from '@/utils/payloadTree'
import { getDescendants } from '@/utils/payloadTree.client'
import { getYear } from 'date-fns'
import { noop, union } from 'lodash'
import { createContext, useContext, useMemo, useState } from 'react'
import useSWR from 'swr'

export const EventFilterContext = createContext<{
  filteredEvents: Event[]
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  campaigns: Campaign[]
  filteredCountryISOA2?: string[] | null
  filteredCategorySlug?: string[] | null
  filteredCompanySlug?: string[] | null
  filteredOrganisingGroupSlug?: string[] | null
  filteredCampaignSlug?: string[] | null
  filteredCountries?: Country[] | null
  filteredCategories?: Category[] | null
  filteredCompanies?: Company[] | null
  filteredCampaigns?: Campaign[] | null
  filteredOrganisingGroups?: OrganisingGroup[] | null
  filteredInitiator?: EventInitiator | null
  filteredYear?: number[] | null
  availableYears: number[]
  setCountryISOA2Filter: (value: string[] | null) => void
  setCategoryFilter: (value: string[] | null) => void
  setCompanyFilter: (value: string[] | null) => void
  setOrganisingGroupFilter: (value: string[] | null) => void
  setCampaignFilter: (value: string[] | null) => void
  setInitiatorFilter: (value: EventInitiator | null) => void
  setYearFilter: (value: string | number | string[] | number[] | null) => void
  setSelectedPopupIds: (value: string[] | null) => void
  selectedPopupIds: string[] | null
}>({
  filteredEvents: [],
  selectedPopupIds: null,
  availableYears: [],
  setCountryISOA2Filter: noop,
  setCategoryFilter: noop,
  setCompanyFilter: noop,
  setOrganisingGroupFilter: noop,
  setCampaignFilter: noop,
  setInitiatorFilter: noop,
  setYearFilter: noop,
  setSelectedPopupIds: noop,
  countries: [],
  categories: [],
  companies: [],
  organisingGroups: [],
  campaigns: [],
})

export type EventFilterContextProviderProps = {
  events: Event[]
  children: React.ReactNode
  overrideFilteredCountryISOA2?: string | string[] | null
  overrideFilteredCategorySlug?: string | string[] | null
  overrideFilteredCompanySlug?: string | string[] | null
  overrideFilteredOrganisingGroupSlug?: string | string[] | null
  overrideFilteredCampaignSlug?: string | string[] | null
  overrideFilteredInitiator?: EventInitiator | null
  overrideFilteredYear?: string | number | string[] | number[] | null
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  campaigns: Campaign[]
}

export function EventFilterContextProvider({
  events,
  children,
  countries,
  categories,
  companies,
  organisingGroups,
  campaigns,
  overrideFilteredCountryISOA2,
  overrideFilteredCategorySlug,
  overrideFilteredCompanySlug,
  overrideFilteredOrganisingGroupSlug,
  overrideFilteredCampaignSlug,
  overrideFilteredInitiator,
  overrideFilteredYear,
}: EventFilterContextProviderProps) {
  const [selectedPopupIds, setSelectedPopupIds] = useState<string[] | null>(null)
  const [filteredCountryISOA2, setCountryISOA2Filter] = useCountryISOA2Filter(
    overrideFilteredCountryISOA2,
  )
  const [filteredCategorySlug, setCategoryFilter] = useCategoryFilter(overrideFilteredCategorySlug)
  const [filteredCompanySlug, setCompanyFilter] = useCompanyFilter(overrideFilteredCompanySlug)
  const [filteredOrganisingGroupSlug, setOrganisingGroupFilter] = useOrganisingGroupFilter(
    overrideFilteredOrganisingGroupSlug,
  )
  const [filteredCampaignSlug, setCampaignFilter] = useCampaignFilter(overrideFilteredCampaignSlug)
  const [filteredInitiator, setInitiatorFilter] = useInitiatorFilter(overrideFilteredInitiator)
  const [filteredYear, setYearFilter] = useYearFilter(overrideFilteredYear)

  const filteredCategories = useMemo(() => {
    return categories?.filter((category) => filteredCategorySlug?.includes(category.slug)) || []
  }, [categories, filteredCategorySlug])

  const filteredCountries = useMemo(() => {
    return countries?.filter((country) => filteredCountryISOA2?.includes(country.isoA2)) || []
  }, [countries, filteredCountryISOA2])

  const filteredCampaigns = useMemo(() => {
    return campaigns?.filter((campaign) => filteredCampaignSlug?.includes(campaign.slug)) || []
  }, [campaigns, filteredCampaignSlug])

  const filteredCompanies = useMemo(() => {
    return companies?.filter((company) => filteredCompanySlug?.includes(company.slug)) || []
  }, [companies, filteredCompanySlug])

  const filteredOrganisingGroups = useMemo(() => {
    return (
      organisingGroups?.filter((organisingGroup) =>
        filteredOrganisingGroupSlug?.includes(organisingGroup.slug),
      ) || []
    )
  }, [organisingGroups, filteredOrganisingGroupSlug])

  const availableYears = useMemo(() => {
    if (!events?.length) {
      return []
    }
    const years = new Set<number>()
    events.forEach((event) => {
      if (event.date) {
        const year = getYear(new Date(event.date))
        years.add(year)
      }
    })
    return Array.from(years).sort((a, b) => b - a) // Sort descending (newest first)
  }, [events])

  const filteredEvents = useMemo(() => {
    if (!events?.length) {
      return []
    }
    let filtered = [...events]
    if (selectedPopupIds && selectedPopupIds.length > 0) {
      filtered = filtered.filter((event) => selectedPopupIds.includes(event.id))
    }
    if (filteredCountryISOA2 && filteredCountryISOA2.length > 0) {
      filtered = filtered.filter((event) =>
        event.countries?.some((country) =>
          filteredCountryISOA2.includes((country as Country).isoA2),
        ),
      )
    }
    if (filteredCategorySlug && filteredCategorySlug.length > 0) {
      filtered = filtered.filter((event) =>
        event.categories?.some((category) =>
          filteredCategorySlug.includes((category as Category).slug),
        ),
      )
    }
    if (filteredCompanySlug && filteredCompanySlug.length > 0) {
      filtered = filtered.filter((event) =>
        event.companies?.some((company) => {
          return (
            filteredCompanySlug.includes((company as Company).slug) ||
            (company as Company).parents?.some((parent) =>
              filteredCompanySlug.some((slug) => parent.url === `/${slug}`),
            )
          )
        }),
      )
    }
    if (filteredOrganisingGroupSlug && filteredOrganisingGroupSlug.length > 0) {
      filtered = filtered.filter((event) =>
        event.organisingGroups?.some((organisingGroup) => {
          return (
            filteredOrganisingGroupSlug.includes((organisingGroup as OrganisingGroup).slug) ||
            (organisingGroup as OrganisingGroup).parents?.some((parent) =>
              filteredOrganisingGroupSlug.some((slug) => parent.url === `/${slug}`),
            )
          )
        }),
      )
    }
    if (filteredCampaignSlug && filteredCampaignSlug.length > 0) {
      filtered = filtered.filter((event) =>
        event.campaigns?.docs?.some((campaign) =>
          filteredCampaignSlug.includes((campaign as Campaign).slug),
        ),
      )
    }
    if (filteredInitiator && filteredInitiator !== EventInitiator.ALL) {
      filtered = filtered.filter((event) => event.initiator === filteredInitiator)
    }
    if (filteredYear && filteredYear.length > 0) {
      filtered = filtered.filter((event) => filteredYear.includes(getYear(new Date(event.date))))
    }
    return filtered
  }, [
    events,
    filteredCountryISOA2,
    filteredCategorySlug,
    filteredCompanySlug,
    filteredOrganisingGroupSlug,
    filteredCampaignSlug,
    filteredInitiator,
    filteredYear,
    selectedPopupIds,
  ])

  return (
    <EventFilterContext.Provider
      value={{
        filteredEvents,
        filteredCountryISOA2,
        filteredCategorySlug,
        filteredCompanySlug,
        filteredOrganisingGroupSlug,
        filteredCampaignSlug,
        filteredInitiator,
        filteredCountries,
        filteredCategories,
        filteredCompanies,
        filteredOrganisingGroups,
        filteredCampaigns,
        filteredYear: filteredYear || null,
        availableYears,
        setCountryISOA2Filter,
        setCategoryFilter,
        setCompanyFilter,
        setOrganisingGroupFilter,
        setCampaignFilter,
        setInitiatorFilter,
        setYearFilter,
        setSelectedPopupIds,
        selectedPopupIds,
        countries,
        categories,
        companies,
        organisingGroups,
        campaigns,
      }}
    >
      {children}
    </EventFilterContext.Provider>
  )
}

export function useEventFilterContext() {
  const context = useContext(EventFilterContext)

  function clearAllFilters() {
    context.setCountryISOA2Filter(null)
    context.setCategoryFilter(null)
    context.setCompanyFilter(null)
    context.setOrganisingGroupFilter(null)
    context.setCampaignFilter(null)
    context.setInitiatorFilter(null)
    context.setYearFilter(null)
    context.setSelectedPopupIds(null)
  }

  return {
    ...context,
    clearAllFilters,
  }
}
