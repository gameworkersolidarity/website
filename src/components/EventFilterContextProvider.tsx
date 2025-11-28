'use client'

import type { Category, Company, Country, Event, OrganisingGroup } from '@/payload-types'
import {
  useCategoryFilter,
  useYearFilter,
  useUnionFilter,
  useCompanyFilter,
  useCountryFilter,
} from '@/utils/global-state'
import { payloadClient } from '@/utils/payload'
import { getYear } from 'date-fns'
import { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'

export const EventFilterContext = createContext<{
  filteredEvents: Event[]
  filteredCountry?: Country | null
  filteredCategory?: Category | null
  filteredCompany?: Company | null
  filteredUnion?: OrganisingGroup | null
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
  const [filteredCountrySlug, setFilteredCountry] = useCountryFilter()
  const [filteredCategorySlug, setFilteredCategory] = useCategoryFilter()
  const [filteredCompanySlug, setFilteredCompany] = useCompanyFilter()
  const [filteredUnionSlug, setFilteredUnion] = useUnionFilter()
  const [filteredYear, setFilteredYear] = useYearFilter()

  const filteredCountry = useSWR(`/api/countries/${filteredCountrySlug}`, () =>
    payloadClient.find({
      collection: 'countries',
      where: { slug: { equals: filteredCountrySlug } },
    }),
  )

  const filteredCategory = useSWR(`/api/categories/${filteredCategorySlug}`, () =>
    payloadClient.find({
      collection: 'categories',
      where: { slug: { equals: filteredCategorySlug } },
    }),
  )

  const filteredCompany = useSWR(`/api/companies/${filteredCompanySlug}`, () =>
    payloadClient.find({
      collection: 'companies',
      where: { slug: { equals: filteredCompanySlug } },
    }),
  )

  const filteredUnion = useSWR(`/api/organising-groups/${filteredUnionSlug}`, () =>
    payloadClient.find({
      collection: 'organisingGroups',
      where: { slug: { equals: filteredUnionSlug } },
    }),
  )

  const filteredEvents = useMemo(() => {
    let filtered = [...events]
    if (filteredCountrySlug) {
      filtered = filtered.filter((event) =>
        event.countries?.some((country) => (country as Country).slug === filteredCountrySlug),
      )
    }
    if (filteredCategorySlug) {
      filtered = filtered.filter((event) =>
        event.categories?.some((category) => (category as Category).slug === filteredCategorySlug),
      )
    }
    if (filteredCompanySlug) {
      filtered = filtered.filter((event) =>
        event.companies?.some((company) => (company as Company).slug === filteredCompanySlug),
      )
    }
    if (filteredUnionSlug) {
      filtered = filtered.filter((event) =>
        event.organisingGroups?.some(
          (organisingGroup) => (organisingGroup as OrganisingGroup).slug === filteredUnionSlug,
        ),
      )
    }
    if (filteredYear) {
      filtered = filtered.filter(
        (event) => getYear(new Date(event.date)) === parseInt(filteredYear),
      )
    }
    return filtered
  }, [
    events,
    filteredCountrySlug,
    filteredCategorySlug,
    filteredCompanySlug,
    filteredUnionSlug,
    filteredYear,
  ])

  return (
    <EventFilterContext.Provider
      value={{
        filteredEvents,
        filteredCountry: filteredCountry.data?.docs?.[0] || null,
        filteredCategory: filteredCategory.data?.docs?.[0] || null,
        filteredCompany: filteredCompany.data?.docs?.[0] || null,
        filteredUnion: filteredUnion.data?.docs?.[0] || null,
        filteredYear: filteredYear ? parseInt(filteredYear) : null,
      }}
    >
      {children}
    </EventFilterContext.Provider>
  )
}

export function useEventFilterContext() {
  return useContext(EventFilterContext)
}
