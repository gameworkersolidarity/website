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
  filteredCountryISOA2?: string | null
  filteredCategorySlug?: string | null
  filteredCompanySlug?: string | null
  filteredOrganisingGroupSlug?: string | null
  filteredCampaignSlug?: string | null
  filteredCountry?: Country | null
  filteredCategory?: Category | null
  filteredCompany?: (Company & { descendants: ArchiveBreadcrumb[] }) | null
  filteredCampaign?: Campaign | null
  filteredOrganisingGroup?: (OrganisingGroup & { descendants: ArchiveBreadcrumb[] }) | null
  filteredInitiator?: EventInitiator | null
  filteredYear?: number | null
  setCountryISOA2Filter: (value: string | null) => void
  setCategoryFilter: (value: string | null) => void
  setCompanyFilter: (value: string | null) => void
  setOrganisingGroupFilter: (value: string | null) => void
  setCampaignFilter: (value: string | null) => void
  setInitiatorFilter: (value: EventInitiator | null) => void
  setYearFilter: (value: string | number | null) => void
  setSelectedPopupIds: (value: string[] | null) => void
  selectedPopupIds: string[] | null
}>({
  filteredEvents: [],
  selectedPopupIds: null,
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
  overrideFilteredCountryISOA2?: string | null
  overrideFilteredCategorySlug?: string | null
  overrideFilteredCompanySlug?: string | null
  overrideFilteredOrganisingGroupSlug?: string | null
  overrideFilteredCampaignSlug?: string | null
  overrideFilteredInitiator?: EventInitiator | null
  overrideFilteredYear?: string | number | null
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

  const filteredCategory = useSWR(`/api/categories/${filteredCategorySlug}`, () => {
    if (!filteredCategorySlug) {
      return null
    }

    return payloadClient.find({
      collection: 'categories',
      where: { slug: { equals: filteredCategorySlug } },
    })
  })

  const filteredCompany = useSWR(`/api/companies/${filteredCompanySlug}`, async () => {
    if (!filteredCompanySlug) {
      return null
    }

    const company = await payloadClient.find({
      collection: 'companies',
      where: { slug: { equals: filteredCompanySlug } },
    })

    const descendants = await getDescendants('companies', company.docs?.[0]?.slug || '')

    return {
      ...company.docs?.[0],
      descendants,
    }
  })

  const filteredCountry = useSWR(`/api/countries/${filteredCountryISOA2}`, () => {
    if (!filteredCountryISOA2) {
      return null
    }
    return payloadClient.find({
      collection: 'countries',
      where: { isoA2: { equals: filteredCountryISOA2 } },
    })
  })

  const filteredCampaign = useSWR(`/api/campaigns/${filteredCampaignSlug}`, () => {
    if (!filteredCampaignSlug) {
      return null
    }
    return payloadClient.find({
      collection: 'campaigns',
      where: { slug: { equals: filteredCampaignSlug } },
    })
  })

  const filteredOrganisingGroup = useSWR(
    `/api/organising-groups/${filteredOrganisingGroupSlug}`,
    async () => {
      if (!filteredOrganisingGroupSlug) {
        return null
      }

      const union = await payloadClient.find({
        collection: 'organisingGroups',
        where: { slug: { equals: filteredOrganisingGroupSlug } },
      })

      const descendants = await getDescendants('organisingGroups', union.docs?.[0]?.slug || '')

      return {
        ...union.docs?.[0],
        descendants,
      }
    },
  )

  const filteredEvents = useMemo(() => {
    if (!events?.length) {
      return []
    }
    let filtered = [...events]
    if (selectedPopupIds && selectedPopupIds.length > 0) {
      filtered = filtered.filter((event) => selectedPopupIds.includes(event.id))
    }
    if (filteredCountryISOA2) {
      filtered = filtered.filter((event) =>
        event.countries?.some((country) => (country as Country).isoA2 === filteredCountryISOA2),
      )
    }
    if (filteredCategorySlug) {
      filtered = filtered.filter((event) =>
        event.categories?.some((category) => (category as Category).slug === filteredCategorySlug),
      )
    }
    if (filteredCompanySlug) {
      filtered = filtered.filter((event) =>
        event.companies?.some((company) => {
          return (
            filteredCompanySlug === (company as Company).slug ||
            (company as Company).parents?.some((parent) => parent.url === `/${filteredCompanySlug}`)
          )
        }),
      )
    }
    if (filteredOrganisingGroupSlug) {
      filtered = filtered.filter((event) =>
        event.organisingGroups?.some((organisingGroup) => {
          return (
            filteredOrganisingGroupSlug === (organisingGroup as OrganisingGroup).slug ||
            (organisingGroup as OrganisingGroup).parents?.some(
              (parent) => parent.url === `/${filteredOrganisingGroupSlug}`,
            )
          )
        }),
      )
    }
    if (filteredCampaignSlug) {
      filtered = filtered.filter((event) =>
        event.campaigns?.docs?.some(
          (campaign) => (campaign as Campaign).slug === filteredCampaignSlug,
        ),
      )
    }
    if (filteredInitiator && filteredInitiator !== EventInitiator.ALL) {
      filtered = filtered.filter((event) => event.initiator === filteredInitiator)
    }
    if (filteredYear) {
      filtered = filtered.filter((event) => getYear(new Date(event.date)) === Number(filteredYear))
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
        filteredCountry: filteredCountry.data?.docs?.[0] || null,
        filteredCategory: filteredCategory.data?.docs?.[0] || null,
        filteredCompany: filteredCompany.data || null,
        filteredOrganisingGroup: filteredOrganisingGroup.data || null,
        filteredCampaign: filteredCampaign.data?.docs?.[0] as Campaign | null,
        filteredYear: filteredYear ? Number(filteredYear) : null,
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
