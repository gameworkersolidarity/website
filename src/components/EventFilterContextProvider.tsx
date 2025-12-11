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
import { noop } from 'lodash'
import { createContext, useContext, useMemo, useState } from 'react'
import useSWR from 'swr'

export const EventFilterContext = createContext<{
  filteredEvents: Event[]
  filteredCountryISOA2?: string[] | null
  filteredCategorySlug?: string[] | null
  filteredCompanySlug?: string[] | null
  filteredOrganisingGroupSlug?: string[] | null
  filteredCampaignSlug?: string[] | null
  filteredCountries?: Country[] | null
  filteredCategories?: Category[] | null
  filteredCompanies?: (Company & { descendants: ArchiveBreadcrumb[] })[] | null
  filteredCampaigns?: Campaign[] | null
  filteredOrganisingGroups?: (OrganisingGroup & { descendants: ArchiveBreadcrumb[] })[] | null
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
})

export function EventFilterContextProvider({
  events,
  children,
  overrideFilteredCountryISOA2,
  overrideFilteredCategorySlug,
  overrideFilteredCompanySlug,
  overrideFilteredOrganisingGroupSlug,
  overrideFilteredCampaignSlug,
  overrideFilteredInitiator,
  overrideFilteredYear,
}: {
  events: Event[]
  children: React.ReactNode
  overrideFilteredCountryISOA2?: string | string[] | null
  overrideFilteredCategorySlug?: string | string[] | null
  overrideFilteredCompanySlug?: string | string[] | null
  overrideFilteredOrganisingGroupSlug?: string | string[] | null
  overrideFilteredCampaignSlug?: string | string[] | null
  overrideFilteredInitiator?: EventInitiator | null
  overrideFilteredYear?: string | number | string[] | number[] | null
}) {
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

  const filteredCategories = useSWR(
    `/api/categories/${filteredCategorySlug?.join(',') || ''}`,
    async () => {
      if (!filteredCategorySlug || filteredCategorySlug.length === 0) {
        return null
      }

      const results = await Promise.all(
        filteredCategorySlug.map((slug) =>
          payloadClient.find({
            collection: 'categories',
            where: { slug: { equals: slug } },
          }),
        ),
      )

      return results.flatMap((result) => result.docs || [])
    },
  )

  const filteredCompanies = useSWR(
    `/api/companies/${filteredCompanySlug?.join(',') || ''}`,
    async () => {
      if (!filteredCompanySlug || filteredCompanySlug.length === 0) {
        return null
      }

      const results = await Promise.all(
        filteredCompanySlug.map(async (slug) => {
          const company = await payloadClient.find({
            collection: 'companies',
            where: { slug: { equals: slug } },
          })

          const descendants = await getDescendants('companies', company.docs?.[0]?.slug || '')

          return {
            ...company.docs?.[0],
            descendants,
          }
        }),
      )

      return results.filter(Boolean)
    },
  )

  const filteredCountries = useSWR(
    `/api/countries/${filteredCountryISOA2?.join(',') || ''}`,
    async () => {
      if (!filteredCountryISOA2 || filteredCountryISOA2.length === 0) {
        return null
      }
      const results = await Promise.all(
        filteredCountryISOA2.map((isoA2) =>
          payloadClient.find({
            collection: 'countries',
            where: { isoA2: { equals: isoA2 } },
          }),
        ),
      )

      return results.flatMap((result) => result.docs || [])
    },
  )

  const filteredCampaigns = useSWR(
    `/api/campaigns/${filteredCampaignSlug?.join(',') || ''}`,
    async () => {
      if (!filteredCampaignSlug || filteredCampaignSlug.length === 0) {
        return null
      }
      const results = await Promise.all(
        filteredCampaignSlug.map((slug) =>
          payloadClient.find({
            collection: 'campaigns',
            where: { slug: { equals: slug } },
          }),
        ),
      )

      return results.flatMap((result) => result.docs || [])
    },
  )

  const filteredOrganisingGroups = useSWR(
    `/api/organising-groups/${filteredOrganisingGroupSlug?.join(',') || ''}`,
    async () => {
      if (!filteredOrganisingGroupSlug || filteredOrganisingGroupSlug.length === 0) {
        return null
      }

      const results = await Promise.all(
        filteredOrganisingGroupSlug.map(async (slug) => {
          const union = await payloadClient.find({
            collection: 'organisingGroups',
            where: { slug: { equals: slug } },
          })

          const descendants = await getDescendants('organisingGroups', union.docs?.[0]?.slug || '')

          return {
            ...union.docs?.[0],
            descendants,
          }
        }),
      )

      return results.filter(Boolean)
    },
  )

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
        filteredCountries: filteredCountries.data || null,
        filteredCategories: filteredCategories.data || null,
        filteredCompanies: filteredCompanies.data || null,
        filteredOrganisingGroups: filteredOrganisingGroups.data || null,
        filteredCampaigns: filteredCampaigns.data || null,
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
