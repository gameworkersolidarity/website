'use client'

import { EventInitiator } from '@/collections/enums'
import type { Campaign, Category, Company, Country, Event, OrganisingGroup } from '@/payload-types'
import {
  useCategoryFilter,
  useYearFilter,
  useUnionFilter,
  useCompanyFilter,
  useCountryISOA2Filter,
  useCampaignFilter,
  useInitiatorFilter,
} from '@/utils/global-state'
import { payloadClient } from '@/utils/payload'
import { ArchiveBreadcrumb } from '@/utils/payloadTree'
import { getDescendants } from '@/utils/payloadTree.client'
import { getYear } from 'date-fns'
import { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'

export const EventFilterContext = createContext<{
  filteredEvents: Event[]
  filteredCountry?: Country | null
  filteredCategory?: Category | null
  filteredCompany?: (Company & { descendants: ArchiveBreadcrumb[] }) | null
  filteredCampaign?: Campaign | null
  filteredUnion?: (OrganisingGroup & { descendants: ArchiveBreadcrumb[] }) | null
  filteredInitiator?: EventInitiator | null
  filteredYear?: number | null
}>({
  filteredEvents: [],
})

export function EventFilterContextProvider({
  events,
  children,
}: {
  events: Event[]
  children: React.ReactNode
}) {
  const [filteredCountryISOA2, setFilteredCountry] = useCountryISOA2Filter()
  const [filteredCategorySlug, setFilteredCategory] = useCategoryFilter()
  const [filteredCompanySlug, setFilteredCompany] = useCompanyFilter()
  const [filteredUnionSlug, setFilteredUnion] = useUnionFilter()
  const [filteredCampaignSlug, setFilteredCampaign] = useCampaignFilter()
  const [filteredInitiator, setFilteredInitiator] = useInitiatorFilter()
  const [filteredYear, setFilteredYear] = useYearFilter()

  const filteredCountry = useSWR(`/api/countries/${filteredCountryISOA2}`, () => {
    if (!filteredCountryISOA2) {
      return null
    }

    return payloadClient.find({
      collection: 'countries',
      where: { isoA2: { equals: filteredCountryISOA2 } },
    })
  })

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

  const filteredCampaign = useSWR(`/api/campaigns/${filteredCampaignSlug}`, () => {
    if (!filteredCampaignSlug) {
      return null
    }
    return payloadClient.find({
      collection: 'campaigns',
      where: { slug: { equals: filteredCampaignSlug } },
    })
  })

  const filteredUnion = useSWR(`/api/organising-groups/${filteredUnionSlug}`, async () => {
    if (!filteredUnionSlug) {
      return null
    }

    const union = await payloadClient.find({
      collection: 'organisingGroups',
      where: { slug: { equals: filteredUnionSlug } },
    })

    const descendants = await getDescendants('organisingGroups', union.docs?.[0]?.slug || '')

    return {
      ...union.docs?.[0],
      descendants,
    }
  })

  const filteredEvents = useMemo(() => {
    let filtered = [...events]
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
          console.log('company', company)
          return (
            filteredCompanySlug === (company as Company).slug ||
            (company as Company).parents?.some((parent) => parent.url === `/${filteredCompanySlug}`)
          )
        }),
      )
    }
    if (filteredUnionSlug) {
      filtered = filtered.filter((event) =>
        event.organisingGroups?.some((organisingGroup) => {
          return (
            filteredUnionSlug === (organisingGroup as OrganisingGroup).slug ||
            (filteredUnion.data?.descendants || []).some(
              (descendant) => descendant.slug === (organisingGroup as OrganisingGroup).slug,
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
    if (filteredInitiator) {
      filtered = filtered.filter((event) => event.initiator === filteredInitiator)
    }
    if (filteredYear) {
      filtered = filtered.filter(
        (event) => getYear(new Date(event.date)) === parseInt(filteredYear),
      )
    }
    return filtered
  }, [
    events,
    filteredCountryISOA2,
    filteredCategorySlug,
    filteredCompanySlug,
    filteredUnionSlug,
    filteredCampaignSlug,
    filteredInitiator,
    filteredYear,
  ])

  return (
    <EventFilterContext.Provider
      value={{
        filteredEvents,
        filteredCountry: filteredCountry.data?.docs?.[0] || null,
        filteredCategory: filteredCategory.data?.docs?.[0] || null,
        filteredCompany: filteredCompany.data || null,
        filteredUnion: filteredUnion.data || null,
        filteredCampaign: filteredCampaign.data?.docs?.[0] as Campaign | null,
        filteredInitiator: filteredInitiator || null,
        filteredYear: filteredYear ? parseInt(filteredYear) : null,
      }}
    >
      {children}
    </EventFilterContext.Provider>
  )
}

export function useEventFilterContext() {
  const context = useContext(EventFilterContext)
  const [countryFilter, setCountryISOA2Filter] = useCountryISOA2Filter()
  const [categoryFilter, setCategoryFilter] = useCategoryFilter()
  const [companyFilter, setCompanyFilter] = useCompanyFilter()
  const [unionFilter, setUnionFilter] = useUnionFilter()
  const [campaignFilter, setCampaignFilter] = useCampaignFilter()
  const [initiatorFilter, setInitiatorFilter] = useInitiatorFilter()
  const [yearFilter, setYearFilter] = useYearFilter()
  return {
    ...context,
    countryFilter,
    categoryFilter,
    companyFilter,
    unionFilter,
    campaignFilter,
    yearFilter,
    initiatorFilter,
    setCountryISOA2Filter,
    setCategoryFilter,
    setCompanyFilter,
    setUnionFilter,
    setCampaignFilter,
    setYearFilter,
    setInitiatorFilter,
  }
}
