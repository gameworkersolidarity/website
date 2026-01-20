'use client'

import { EventInitiatorFilter } from '@/collections/enums'
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
import { getYear } from 'date-fns'
import { noop } from 'lodash'
import { createContext, Dispatch, SetStateAction, useContext, useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'

export type HighlightRange = {
  field: string
  start: number
  end: number
}

export type EventHighlights = {
  [eventId: string]: {
    [field: string]: Array<[number, number]>
  }
}

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
  filteredInitiator?: EventInitiatorFilter | null
  filteredYear?: number[] | null
  availableYears: number[]
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  highlights: EventHighlights
  setCountryISOA2Filter: ReturnType<typeof useCountryISOA2Filter>[1]
  setCategoryFilter: ReturnType<typeof useCategoryFilter>[1]
  setCompanyFilter: ReturnType<typeof useCompanyFilter>[1]
  setOrganisingGroupFilter: ReturnType<typeof useOrganisingGroupFilter>[1]
  setCampaignFilter: ReturnType<typeof useCampaignFilter>[1]
  setInitiatorFilter: ReturnType<typeof useInitiatorFilter>[1]
  setYearFilter: ReturnType<typeof useYearFilter>[1]
  setSelectedPopupIds: Dispatch<SetStateAction<string[] | null>>
  selectedPopupIds: string[] | null
}>({
  filteredEvents: [],
  selectedPopupIds: null,
  availableYears: [],
  searchQuery: '',
  setSearchQuery: noop,
  highlights: {},
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
  overrideFilteredInitiator?: EventInitiatorFilter | null
  overrideFilteredYear?: string | number | string[] | number[] | null
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  campaigns: Campaign[]
}

// Helper function to create a searchable version of an event with description converted to plain text
function createSearchableEvent(event: Event) {
  let descriptionText: string | undefined
  if (event.description) {
    try {
      descriptionText = lexicalToPlainText(event.description)
    } catch (e) {
      // If conversion fails, skip description
    }
  }

  return {
    event,
    name: event.name || '',
    description: descriptionText || '',
    location: event.location || '',
    source: event.source || '',
    categoryNames: event.categories
      ?.map((cat) => (typeof cat === 'object' && cat !== null && 'name' in cat ? (cat as Category).name : ''))
      .filter(Boolean)
      .join(' ') || '',
    countryNames: event.countries
      ?.map((country) =>
        typeof country === 'object' && country !== null && 'name' in country ? (country as Country).name : '',
      )
      .filter(Boolean)
      .join(' ') || '',
    companyNames: event.companies
      ?.map((company) =>
        typeof company === 'object' && company !== null && 'name' in company ? (company as Company).name : '',
      )
      .filter(Boolean)
      .join(' ') || '',
    organisingGroupNames: event.organisingGroups
      ?.map((og) =>
        typeof og === 'object' && og !== null && 'name' in og ? (og as OrganisingGroup).name : '',
      )
      .filter(Boolean)
      .join(' ') || '',
    campaignNames: event.campaigns?.docs
      ?.map((campaign) =>
        typeof campaign === 'object' && campaign !== null && 'name' in campaign ? (campaign as Campaign).name : '',
      )
      .filter(Boolean)
      .join(' ') || '',
  }
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
  const [searchQuery, setSearchQuery] = useState<string>('')
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

  // Build search index and perform fuzzy search
  const { filteredEvents, highlights } = useMemo(() => {
    if (!events?.length) {
      return { filteredEvents: [], highlights: {} }
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
    if (filteredInitiator && filteredInitiator !== EventInitiatorFilter.ALL) {
      filtered = filtered.filter((event) => event.initiator === filteredInitiator)
    }
    if (filteredYear && filteredYear.length > 0) {
      filtered = filtered.filter((event) => filteredYear.includes(getYear(new Date(event.date))))
    }

    // Apply text search if query exists
    const highlights: EventHighlights = {}
    if (searchQuery.trim()) {
      // Build search index with searchable event data
      const searchIndex = filtered.map((event) => createSearchableEvent(event))

      // Configure Fuse.js for fuzzy search
      const fuse = new Fuse(searchIndex, {
        keys: [{
          name: 'name',
          weight: 2,
        }, {
          name: 'description',
          weight: 2,
        }, 'location', 'categoryNames', 'countryNames', 'companyNames', 'organisingGroupNames', 'campaignNames'],
        threshold: 0.8, // 0.0 = exact match, 1.0 = match anything
        includeMatches: true,
        includeScore: true,
        findAllMatches: false,
        minMatchCharLength: 3,
        shouldSort: false
      })

      // Perform search
      const results = fuse.search(searchQuery.trim())
      const matchedEvents = results.map((result) => result.item.event)

      // Collect match ranges for highlighting by field
      results.forEach((result) => {
        const eventId = result.item.event.id
        if (!highlights[eventId]) {
          highlights[eventId] = {}
        }

        // Process all matches across all fields
        result.matches?.forEach((match) => {
          const field = match.key || ''
          if (field && match.indices && match.indices.length > 0) {
            if (!highlights[eventId][field]) {
              highlights[eventId][field] = []
            }
            // Fuse indices are [start, end] where both are inclusive
            highlights[eventId][field].push(...match.indices)
          }
        })
      })

      return { filteredEvents: matchedEvents, highlights }
    }

    return { filteredEvents: filtered, highlights: {} }
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
    searchQuery,
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
        searchQuery,
        setSearchQuery,
        highlights,
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
    context.setSearchQuery('')
  }

  return {
    ...context,
    clearAllFilters,
  }
}
