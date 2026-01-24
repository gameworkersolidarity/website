'use client'

import { twMerge } from 'tailwind-merge'
import { ActionInitiator, ActionInitiatorFilter } from '@/collections/enums'
import { DisplayInitiator } from '@/utils/displayInitiator'
import { useActionFilterContext } from '@/components/ActionFilterContextProvider'
import Link from 'next/link'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CategoryLabel } from '@/components/CategoryLabel'
import { CompanyLabel } from '@/components/CompanyLabel'
import { CountryLabel } from '@/components/CountryLabel'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'
import { CampaignLabel } from '@/components/CampaignLabel'
import { MultiSelect } from '@/components/MultiSelect'
import pluralize from 'pluralize'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useState } from 'react'
import {
  ChevronsDown,
  ChevronsDownUp,
  ChevronsUp,
  ChevronsUpDown,
  Expand,
  ListCollapse,
  Search,
  X,
} from 'lucide-react'
import { useMediaQuery } from 'usehooks-ts'
import { CollapsibleListButton } from '@/components/CollapsibleList'
import { Input } from '@/components/ui/input'

export type ActionFilterProps = {
  years?: boolean
  categories?: boolean
  companies?: boolean
  organisingGroups?: boolean
  campaigns?: boolean
  countries?: boolean
  initiators?: boolean
}

export function ActionFilter({
  years = true,
  categories = true,
  companies = true,
  organisingGroups = true,
  campaigns = true,
  countries = true,
  initiators = true,
}: ActionFilterProps) {
  const {
    filteredCountryISOA2,
    filteredCountries,
    setCountryISOA2Filter,
    filteredCategorySlug,
    filteredCategories,
    setCategoryFilter,
    filteredCompanySlug,
    filteredCompanies,
    setCompanyFilter,
    filteredOrganisingGroupSlug,
    filteredOrganisingGroups,
    setOrganisingGroupFilter,
    filteredCampaignSlug,
    filteredCampaigns,
    setCampaignFilter,
    filteredInitiator,
    setInitiatorFilter,
    filteredYear,
    setYearFilter,
    availableYears,
    clearAllFilters,
    selectedPopupIds,
    setSelectedPopupIds,
    searchQuery,
    setSearchQuery,
    ...filterContext
  } = useActionFilterContext()

  const countEnabledFilters = [
    years,
    categories,
    companies,
    organisingGroups,
    campaigns,
    countries,
  ].filter(Boolean).length

  const isMobile = useMediaQuery('(max-width: 768px)')

  const [open, setOpen] = useState(!isMobile)

  return (
    <Collapsible
      className={twMerge(
        'flex flex-col items-baseline',
        initiators ? 'flex-col' : 'md:flex-row gap-4',
      )}
      open={open}
      onOpenChange={setOpen}
    >
      <section
        className={twMerge(
          'shrink-0 flex flex-row items-center justify-between gap-2',
          initiators && 'w-full ',
        )}
      >
        <div className="flex flex-row items-baseline gap-2">
          <CollapsibleTrigger className="flex flex-row items-center gap-2 cursor-pointer">
            <h2 className="text-xs uppercase opacity-50 font-mono">Filters</h2>
            {isMobile && (
              <CollapsibleListButton open={open} className="w-3.5 h-3.5 text-stone-500" />
            )}
          </CollapsibleTrigger>
          {/* {((filteredCountryISOA2 && filteredCountryISOA2.length > 0) ||
            (filteredCategorySlug && filteredCategorySlug.length > 0) ||
            (filteredCompanySlug && filteredCompanySlug.length > 0) ||
            (filteredOrganisingGroupSlug && filteredOrganisingGroupSlug.length > 0) ||
            (filteredCampaignSlug && filteredCampaignSlug.length > 0) ||
            (filteredInitiator && filteredInitiator !== ActionInitiator.WORKER_LED) ||
            (filteredYear && filteredYear.length > 0)) && (
            <div className="link" onClick={clearAllFilters}>
              reset ⤬
            </div>
          )} */}
        </div>
        <div className="flex flex-row items-center gap-2">
          {/* Search input - always visible */}
          <div className="relative flex items-center">
            <Search className="absolute left-2 w-4 text-gray-400 grow-0" />
            <Input
              type="text"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-5 text-sm shrink-0 grow"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 h-4 w-4 text-gray-400 hover:text-gray-600 grow-0"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {initiators && (
            <RadioGroup
              value={filteredInitiator || ''}
              onValueChange={(value) => setInitiatorFilter(value as ActionInitiatorFilter)}
              className="hidden md:flex flex-row items-right gap-3"
            >
              {[
                { label: 'Worker-led', value: ActionInitiatorFilter.WORKER_LED },
                { label: 'Boss-led', value: ActionInitiatorFilter.BOSS_LED },
                { label: 'All', value: ActionInitiatorFilter.ALL },
              ].map((initiator) => (
                <div key={initiator.label} className="flex items-center gap-2">
                  <Label htmlFor={initiator.label} className="text-xs uppercase">
                    <RadioGroupItem value={initiator.value || ''} id={initiator.label} />
                    <DisplayInitiator
                      initiator={initiator.value as ActionInitiatorFilter}
                      link="soft"
                    />
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      </section>
      <CollapsibleContent className="w-full">
        <div
          className={twMerge(
            'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2 w-full',
            countEnabledFilters === 5 && 'md:grid-cols-3 lg:grid-cols-5',
            countEnabledFilters === 4 && 'md:grid-cols-2 lg:grid-cols-4',
            countEnabledFilters === 3 && 'md:grid-cols-3 lg:grid-cols-3',
            countEnabledFilters === 2 && 'md:grid-cols-2 lg:grid-cols-2',
            countEnabledFilters === 1 && 'md:grid-cols-1 lg:grid-cols-1',
            initiators && 'mt-2',
          )}
        >
          {categories && (
            <div className="filter-group w-full">
              <MultiSelect
                placeholder="category..."
                options={filterContext.categories || []}
                valueKey="slug"
                renderLabel={(d) => <CategoryLabel category={d} />}
                value={filteredCategorySlug || []}
                onChange={(value) => setCategoryFilter(value.length > 0 ? value : null)}
              />

              {filteredCategories && filteredCategories.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex flex-row flex-wrap items-center gap-2">
                    {filteredCategories.map((category) => (
                      <Link key={category.id} href={category.path!} className="text-xs">
                        Explore{' '}
                        <span className="font-medium link hover:bg-snot-300 lowercase!">
                          {category.name}
                        </span>{' '}
                        actions →
                      </Link>
                    ))}
                  </div>
                  <span
                    className="text-xs link"
                    onClick={() => {
                      setCategoryFilter(null)
                    }}
                  >
                    clear filter ⤬
                  </span>
                </div>
              )}
            </div>
          )}
          {organisingGroups && (
            <div className="filter-group w-full">
              <MultiSelect
                placeholder="union..."
                options={filterContext.organisingGroups || []}
                valueKey="slug"
                renderLabel={(d) => <OrganisingGroupLabel organisingGroup={d} />}
                value={filteredOrganisingGroupSlug || []}
                onChange={(value) => setOrganisingGroupFilter(value.length > 0 ? value : null)}
              />
              {filteredOrganisingGroups && filteredOrganisingGroups.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex flex-row flex-wrap items-center gap-2">
                    {filteredOrganisingGroups.map((organisingGroup) => (
                      <Link
                        key={organisingGroup.id}
                        href={organisingGroup.path!}
                        className="text-xs"
                      >
                        See{' '}
                        <span className="font-medium link hover:bg-snot-300">
                          {organisingGroup.name}
                        </span>{' '}
                        →
                      </Link>
                    ))}
                  </div>
                  <span
                    className="text-xs link"
                    onClick={() => {
                      setOrganisingGroupFilter(null)
                    }}
                  >
                    clear filter ⤬
                  </span>
                </div>
              )}
            </div>
          )}
          {companies && (
            <div className="filter-group w-full">
              <MultiSelect
                placeholder="company..."
                options={filterContext.companies || []}
                value={filteredCompanySlug || []}
                onChange={(value) => setCompanyFilter(value.length > 0 ? value : null)}
                valueKey="slug"
                renderLabel={(d) => <CompanyLabel company={d} />}
              />
              {filteredCompanies && filteredCompanies.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex flex-row flex-wrap items-center gap-2">
                    {filteredCompanies.map((company) => (
                      <Link key={company.id} href={company.path!} className="text-xs">
                        See{' '}
                        <span className="font-medium link hover:bg-snot-300">{company.name}</span> →
                      </Link>
                    ))}
                  </div>
                  <span
                    className="text-xs link"
                    onClick={() => {
                      setCompanyFilter(null)
                    }}
                  >
                    clear filter ⤬
                  </span>
                </div>
              )}
            </div>
          )}
          {campaigns && (
            <div className="filter-group w-full">
              <MultiSelect
                placeholder="campaign..."
                options={filterContext.campaigns || []}
                valueKey="slug"
                renderLabel={(d) => <CampaignLabel campaign={d} />}
                value={filteredCampaignSlug || []}
                onChange={(value) => setCampaignFilter(value.length > 0 ? value : null)}
              />
              {filteredCampaigns && filteredCampaigns.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex flex-row flex-wrap items-center gap-2">
                    {filteredCampaigns.map((campaign) => (
                      <Link key={campaign.id} href={campaign.path!} className="text-xs">
                        See{' '}
                        <span className="font-medium link hover:bg-snot-300">{campaign.name}</span>{' '}
                        →
                      </Link>
                    ))}
                  </div>
                  <span
                    className="text-xs link"
                    onClick={() => {
                      setCampaignFilter(null)
                    }}
                  >
                    clear filter ⤬
                  </span>
                </div>
              )}
            </div>
          )}
          {countries && (
            <div className="filter-group w-full">
              <MultiSelect
                placeholder="country..."
                options={filterContext.countries || []}
                value={filteredCountryISOA2 || []}
                onChange={(value) => setCountryISOA2Filter(value.length > 0 ? value : null)}
                valueKey="isoA2"
                renderLabel={(d) => <CountryLabel country={d} />}
              />
              {filteredCountries && filteredCountries.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex flex-row flex-wrap items-center gap-2">
                    {filteredCountries.map((country) => (
                      <Link key={country.id} href={country.path!} className="text-xs">
                        See{' '}
                        <span className="font-medium link hover:bg-snot-300">{country.name}</span> →
                      </Link>
                    ))}
                  </div>
                  <span
                    className="text-xs link"
                    onClick={() => {
                      setCountryISOA2Filter(null)
                    }}
                  >
                    clear filter ⤬
                  </span>
                </div>
              )}
            </div>
          )}
          {years && (
            <div className="filter-group w-full">
              <MultiSelect
                placeholder="year..."
                valueKey="value"
                renderLabel={(d) => <span>{d.value.toString()}</span>}
                options={availableYears.map((year) => ({
                  label: year.toString(),
                  value: year.toString(),
                }))}
                value={filteredYear?.map(String) || []}
                onChange={(value) => setYearFilter(value.length > 0 ? value.map(Number) : null)}
              />
              {filteredYear && filteredYear.length > 0 && (
                <span
                  className="text-xs link"
                  onClick={() => {
                    setYearFilter(null)
                  }}
                >
                  clear filter ⤬
                </span>
              )}
            </div>
          )}
        </div>
        {selectedPopupIds && selectedPopupIds.length > 0 && (
          <div className="mt-2 text-xs flex flex-row flex-wrap items-center gap-2">
            You&apos;re viewing a selection of {pluralize('action', selectedPopupIds.length, true)}.{' '}
            <div
              className="link"
              onClick={() => {
                setSelectedPopupIds(null)
              }}
            >
              Deselect all
            </div>
          </div>
        )}
        {/* <div>
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div> */}
      </CollapsibleContent>
    </Collapsible>
  )
}
