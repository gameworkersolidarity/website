'use client'

import { useQueryState } from 'nuqs'
import type { Country, Category, Company, OrganisingGroup } from '@/payload-types'

interface ActionsFiltersProps {
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
}

export function ActionsFilters({
  countries,
  categories,
  companies,
  organisingGroups,
}: ActionsFiltersProps) {
  const [countryFilter, setCountryFilter] = useQueryState('country', {
    clearOnDefault: true,
  })
  const [categoryFilter, setCategoryFilter] = useQueryState('category', {
    clearOnDefault: true,
  })
  const [companyFilter, setCompanyFilter] = useQueryState('company', {
    clearOnDefault: true,
  })
  const [unionFilter, setUnionFilter] = useQueryState('union', {
    clearOnDefault: true,
  })
  const [yearFilter, setYearFilter] = useQueryState('year', {
    clearOnDefault: true,
  })

  // Get unique years from all actions (we'll calculate this from context or pass as prop)
  // For now, we'll generate years from 2018 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2017 }, (_, i) => currentYear - i)

  return (
    <div className="homepage-filters">
      <div className="filter-group">
        <span className="filter-label">Filter by</span>
        <select
          className="filter-select"
          value={countryFilter || ''}
          onChange={(e) => setCountryFilter(e.target.value || null)}
        >
          <option value="">Country ▾</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id.toString()}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <select
          className="filter-select"
          value={categoryFilter || ''}
          onChange={(e) => setCategoryFilter(e.target.value || null)}
        >
          <option value="">Category ▾</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id.toString()}>
              {category.Emoji && `${category.Emoji} `}
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <select
          className="filter-select"
          value={companyFilter || ''}
          onChange={(e) => setCompanyFilter(e.target.value || null)}
        >
          <option value="">Company ▾</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id.toString()}>
              {company.name}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <select
          className="filter-select"
          value={unionFilter || ''}
          onChange={(e) => setUnionFilter(e.target.value || null)}
        >
          <option value="">Union ▾</option>
          {organisingGroups
            .filter((group) => group.IsUnion)
            .map((group) => (
              <option key={group.id} value={group.id.toString()}>
                {group.name}
              </option>
            ))}
        </select>
      </div>
      <div className="filter-group">
        <select
          className="filter-select"
          value={yearFilter || ''}
          onChange={(e) => setYearFilter(e.target.value || null)}
        >
          <option value="">Select year</option>
          {years.map((year) => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
