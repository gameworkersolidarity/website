'use client'

import { useQueryState } from 'nuqs'
import { useMemo } from 'react'
import type { SolidarityAction, Country, Category, Company, OrganisingGroup } from '@/payload-types'
import { WorldMap } from './WorldMap'
import { ActionsTimeline } from './ActionsTimeline'

interface FilteredHomepageContentProps {
  actions: SolidarityAction[]
  countries: Country[]
}

// Type guard for Country
function isCountry(obj: Country['id'] | Country): obj is Country {
  return typeof obj === 'object' && obj !== null && 'countryCode' in obj
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

export function FilteredHomepageContent({ actions, countries }: FilteredHomepageContentProps) {
  const [countryFilter] = useQueryState('country', { clearOnDefault: true })
  const [categoryFilter] = useQueryState('category', { clearOnDefault: true })
  const [companyFilter] = useQueryState('company', { clearOnDefault: true })
  const [unionFilter] = useQueryState('union', { clearOnDefault: true })
  const [yearFilter] = useQueryState('year', { clearOnDefault: true })

  // Filter actions based on query params
  const filteredActions = useMemo(() => {
    let filtered = [...actions]

    const countryFilterId = countryFilter ? countryFilter : null
    const categoryFilterId = categoryFilter ? categoryFilter : null
    const companyFilterId = companyFilter ? companyFilter : null
    const unionFilterId = unionFilter ? unionFilter : null
    const yearFilterNum = yearFilter ? parseInt(yearFilter, 10) : null

    // Filter by country
    if (countryFilterId) {
      filtered = filtered.filter((action) => {
        if (!action.Country || !Array.isArray(action.Country)) return false
        return action.Country.some((country) => {
          if (typeof country === 'number') {
            return country === countryFilterId
          }
          return isCountry(country) && country.id === countryFilterId
        })
      })
    }

    // Filter by category
    if (categoryFilterId) {
      filtered = filtered.filter((action) => {
        if (!action.Category || !Array.isArray(action.Category)) return false
        return action.Category.some((category) => {
          if (typeof category === 'number') {
            return category === categoryFilterId
          }
          return isCategory(category) && category.id === categoryFilterId
        })
      })
    }

    // Filter by company
    if (companyFilterId) {
      filtered = filtered.filter((action) => {
        if (!action.Company || !Array.isArray(action.Company)) return false
        return action.Company.some((company) => {
          if (typeof company === 'number') {
            return company === companyFilterId
          }
          return isCompany(company) && company.id === companyFilterId
        })
      })
    }

    // Filter by union/organising group
    if (unionFilterId) {
      filtered = filtered.filter((action) => {
        if (!action.OrganisingGroups || !Array.isArray(action.OrganisingGroups)) return false
        return action.OrganisingGroups.some((group) => {
          if (typeof group === 'number') {
            return group === unionFilterId
          }
          return isOrganisingGroup(group) && group.id === unionFilterId
        })
      })
    }

    // Filter by year
    if (yearFilterNum) {
      filtered = filtered.filter((action) => {
        const actionYear = new Date(action.Date).getFullYear()
        return actionYear === yearFilterNum
      })
    }

    return filtered
  }, [actions, countryFilter, categoryFilter, companyFilter, unionFilter, yearFilter])

  // Sort actions by date (most recent first)
  const sortedActions = useMemo(() => {
    return [...filteredActions].sort(
      (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime(),
    )
  }, [filteredActions])

  // Create a map of country codes to action counts from filtered actions
  const countryDataMap = useMemo(() => {
    const countryActionCounts: Record<string, number> = {}

    filteredActions.forEach((action) => {
      if (action.Country && Array.isArray(action.Country)) {
        action.Country.forEach((country) => {
          if (isCountry(country) && country.countryCode) {
            const code = country.countryCode
            countryActionCounts[code] = (countryActionCounts[code] || 0) + 1
          }
        })
      }
    })

    const result: Record<string, { queue: number; color: string }> = {}
    Object.entries(countryActionCounts).forEach(([code, count]) => {
      result[code] = {
        queue: count,
        color: '',
      }
    })

    return result
  }, [filteredActions])

  return (
    <>
      <div className="homepage-grid">
        <div className="map-section">
          <div className="map-container">
            <WorldMap data={countryDataMap} />
          </div>
        </div>
        <div className="timeline-section">
          <ActionsTimeline actions={sortedActions} />
        </div>
      </div>
    </>
  )
}
