'use client'

import { useQueryState } from 'nuqs'
import { useMemo } from 'react'
import type { Event, Country, Category, Company, OrganisingGroup } from '@/payload-types'
import { WorldMap } from './WorldMap'
import { ActionsTimeline } from './ActionsTimeline'

interface FilteredHomepageContentProps {
  events: Event[]
  countries: Country[]
}

// Type guard for Country
function isCountry(obj: Country['id'] | Country): obj is Country {
  return typeof obj === 'object' && obj !== null && 'isoA2' in obj
}

// Type guard for Category
function isCategory(obj: Category['id'] | Category): obj is Category {
  return typeof obj === 'object' && obj !== null && 'Name' in obj
}

// Type guard for Company
function isCompany(obj: Company['id'] | Company): obj is Company {
  return typeof obj === 'object' && obj !== null && 'Name' in obj
}

// Type guard for OrganisingGroup
function isOrganisingGroup(obj: OrganisingGroup['id'] | OrganisingGroup): obj is OrganisingGroup {
  return typeof obj === 'object' && obj !== null && 'Name' in obj
}

export function FilteredHomepageContent({ events, countries }: FilteredHomepageContentProps) {
  const [countryFilter] = useQueryState('country', { clearOnDefault: true })
  const [categoryFilter] = useQueryState('category', { clearOnDefault: true })
  const [companyFilter] = useQueryState('company', { clearOnDefault: true })
  const [unionFilter] = useQueryState('union', { clearOnDefault: true })
  const [yearFilter] = useQueryState('year', { clearOnDefault: true })

  // Filter events based on query params
  const filteredEvents = useMemo(() => {
    let filtered = [...events]

    const countryFilterId = countryFilter ? countryFilter : null
    const categoryFilterId = categoryFilter ? categoryFilter : null
    const companyFilterId = companyFilter ? companyFilter : null
    const unionFilterId = unionFilter ? unionFilter : null
    const yearFilterNum = yearFilter ? parseInt(yearFilter, 10) : null

    // Filter by country
    if (countryFilterId) {
      filtered = filtered.filter((event) => {
        if (!event.countries || !Array.isArray(event.countries)) return false
        return event.countries.some((country) => {
          if (typeof country === 'string') {
            return country === countryFilterId
          }
          return isCountry(country) && country.id === countryFilterId
        })
      })
    }

    // Filter by category
    if (categoryFilterId) {
      filtered = filtered.filter((event) => {
        if (!event.categories || !Array.isArray(event.categories)) return false
        return event.categories.some((category) => {
          if (typeof category === 'string') {
            return category === categoryFilterId
          }
          return isCategory(category) && category.id === categoryFilterId
        })
      })
    }

    // Filter by company
    if (companyFilterId) {
      filtered = filtered.filter((event) => {
        if (!event.companies || !Array.isArray(event.companies)) return false
        return event.companies.some((company) => {
          if (typeof company === 'string') {
            return company === companyFilterId
          }
          return isCompany(company) && company.id === companyFilterId
        })
      })
    }

    // Filter by union/organising group
    if (unionFilterId) {
      filtered = filtered.filter((event) => {
        if (!event.organisingGroups || !Array.isArray(event.organisingGroups)) return false
        return event.organisingGroups.some((group) => {
          if (typeof group === 'string') {
            return group === unionFilterId
          }
          return isOrganisingGroup(group) && group.id === unionFilterId
        })
      })
    }

    // Filter by year
    if (yearFilterNum) {
      filtered = filtered.filter((event) => {
        const eventYear = new Date(event.date).getFullYear()
        return eventYear === yearFilterNum
      })
    }

    return filtered
  }, [events, countryFilter, categoryFilter, companyFilter, unionFilter, yearFilter])

  // Sort events by date (most recent first)
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }, [filteredEvents])

  // Create a map of country codes to event counts from filtered events
  const countryDataMap = useMemo(() => {
    const countryEventCounts: Record<string, number> = {}

    filteredEvents.forEach((event) => {
      if (event.countries && Array.isArray(event.countries)) {
        event.countries.forEach((country) => {
          if (isCountry(country) && country.isoA2) {
            const code = country.isoA2
            countryEventCounts[code] = (countryEventCounts[code] || 0) + 1
          }
        })
      }
    })

    const result: Record<string, { queue: number; color: string }> = {}
    Object.entries(countryEventCounts).forEach(([code, count]) => {
      result[code] = {
        queue: count,
        color: '',
      }
    })

    return result
  }, [filteredEvents])

  return (
    <>
      <div className="homepage-grid">
        <div className="map-section">
          <div className="map-container">
            <WorldMap data={countryDataMap} />
          </div>
        </div>
        <div className="timeline-section">
          <ActionsTimeline events={sortedEvents} />
        </div>
      </div>
    </>
  )
}
