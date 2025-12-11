'use client'

import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Country, Category, Company, OrganisingGroup, Campaign } from '@/payload-types'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import Emoji from 'a11y-react-emoji'
import { EventInitiator } from '@/collections/enums'
import { DisplayInitiator } from '@/utils/displayInitiator'
import { useEventFilterContext } from '@/components/EventFilterContextProvider'
import Link from 'next/link'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CategoryLabel } from '@/components/CategoryLabel'
import { CompanyLabel } from '@/components/CompanyLabel'
import { CountryLabel } from '@/components/CountryLabel'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'
import { CampaignLabel } from '@/components/CampaignLabel'

interface EventFilterProps {
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  campaigns: Campaign[]
  // searchQuery: string
  // setSearchQuery: (value: string) => void
}

export function EventFilter({
  countries,
  categories,
  companies,
  organisingGroups,
  campaigns,
  // searchQuery,
  // setSearchQuery,
}: EventFilterProps) {
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
  } = useEventFilterContext()

  return (
    <div className="homepage-filters">
      <div className="flex flex-row items-center justify-between gap-2 mb-2">
        <div className="flex flex-row items-baseline gap-2">
          <h2 className="font-bold">Filter by</h2>
          {((filteredCountryISOA2 && filteredCountryISOA2.length > 0) ||
            (filteredCategorySlug && filteredCategorySlug.length > 0) ||
            (filteredCompanySlug && filteredCompanySlug.length > 0) ||
            (filteredOrganisingGroupSlug && filteredOrganisingGroupSlug.length > 0) ||
            (filteredCampaignSlug && filteredCampaignSlug.length > 0) ||
            filteredInitiator ||
            (filteredYear && filteredYear.length > 0)) && (
            <div className="link" onClick={clearAllFilters}>
              clear filters ⤬
            </div>
          )}
        </div>
        <RadioGroup
          value={filteredInitiator || ''}
          onValueChange={(value) => setInitiatorFilter(value as EventInitiator)}
          className="hidden md:flex flex-row items-right gap-3"
        >
          {[
            ...Object.values(EventInitiator).map((initiator) => ({
              label: initiator.charAt(0).toUpperCase() + initiator.slice(1),
              value: initiator,
            })),
          ].map((initiator) => (
            <div key={initiator.label} className="flex items-center gap-2">
              <Label htmlFor={initiator.label} className="text-xs uppercase">
                <RadioGroupItem value={initiator.value || ''} id={initiator.label} />
                <DisplayInitiator initiator={initiator.value as EventInitiator} link="soft" />
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
        <div className="filter-group w-full">
          <MultiSelect
            placeholder="country..."
            options={countries}
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
                    See <span className="font-medium link hover:bg-snot-300">{country.name}</span> →
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
        <div className="filter-group w-full">
          <MultiSelect
            placeholder="category..."
            options={categories}
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
                    See <span className="font-medium link hover:bg-snot-300">{category.name}</span>{' '}
                    →
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
        <div className="filter-group w-full">
          <MultiSelect
            placeholder="company..."
            options={companies}
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
                    See <span className="font-medium link hover:bg-snot-300">{company.name}</span> →
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
        <div className="filter-group w-full">
          <MultiSelect
            placeholder="union..."
            options={organisingGroups}
            valueKey="slug"
            renderLabel={(d) => <OrganisingGroupLabel organisingGroup={d} />}
            value={filteredOrganisingGroupSlug || []}
            onChange={(value) => setOrganisingGroupFilter(value.length > 0 ? value : null)}
          />
          {filteredOrganisingGroups && filteredOrganisingGroups.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex flex-row flex-wrap items-center gap-2">
                {filteredOrganisingGroups.map((organisingGroup) => (
                  <Link key={organisingGroup.id} href={organisingGroup.path!} className="text-xs">
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
        <div className="filter-group w-full">
          <MultiSelect
            placeholder="campaign..."
            options={campaigns}
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
                    See <span className="font-medium link hover:bg-snot-300">{campaign.name}</span>{' '}
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
      </div>
      {/* <div>
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div> */}
    </div>
  )
}

function MultiSelect<T, K extends keyof T>({
  options,
  value,
  onChange,
  valueKey,
  renderLabel,
  placeholder = 'Select...',
}: {
  options: T[]
  value: string[]
  valueKey: K
  onChange: (value: string[]) => void
  renderLabel: (item: T) => React.ReactNode
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedItems = options.filter((option) => value.includes(String(option[valueKey])))

  const toggleValue = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const removeValue = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== optionValue))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={twMerge(
            'w-full justify-between overflow-hidden min-h-10 h-auto',
            value.length > 0 && 'bg-snot-300',
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 items-start justify-start">
            {selectedItems.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selectedItems.length <= 1 ? (
              selectedItems.map((item) => (
                <div key={String(item[valueKey])} className="flex items-center gap-1 text-sm">
                  {renderLabel(item)}
                  {/* <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={(e) => removeValue(String(item[valueKey]), e)}
                  /> */}
                </div>
              ))
            ) : (
              <span className="text-sm flex flex-row flex-wrap items-center gap-1">
                {selectedItems.slice(0, 1).map((item) => (
                  <span key={String(item[valueKey])}>{renderLabel(item)}</span>
                ))}
                <span>+ {selectedItems.length - 1} more</span>
              </span>
            )}
          </div>
          <ChevronsUpDown className="opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const optionValue = String(option[valueKey])
                const isSelected = value.includes(optionValue)
                return (
                  <CommandItem
                    key={optionValue}
                    onSelect={() => {
                      toggleValue(optionValue)
                    }}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleValue(optionValue)}
                      className="mr-2"
                    />
                    {renderLabel(option)}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
