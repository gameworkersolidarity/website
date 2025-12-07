'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
    filteredCountry,
    setCountryISOA2Filter,
    filteredCategorySlug,
    filteredCategory,
    setCategoryFilter,
    filteredCompanySlug,
    filteredCompany,
    setCompanyFilter,
    filteredOrganisingGroupSlug,
    filteredOrganisingGroup,
    setOrganisingGroupFilter,
    filteredCampaignSlug,
    filteredCampaign,
    setCampaignFilter,
    filteredInitiator,
    setInitiatorFilter,
    filteredYear,
    setYearFilter,
    clearAllFilters,
  } = useEventFilterContext()

  // Get unique years from all actions (we'll calculate this from context or pass as prop)
  // For now, we'll generate years from 2018 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2017 }, (_, i) => currentYear - i)

  return (
    <div className="homepage-filters">
      <div className="flex flex-row items-center justify-between gap-2 mb-2">
        <div className="flex flex-row items-baseline gap-2">
          <h2 className="font-bold">Filter by</h2>
          {(filteredCountryISOA2 ||
            filteredCategorySlug ||
            filteredCompanySlug ||
            filteredOrganisingGroupSlug ||
            filteredCampaignSlug ||
            filteredInitiator ||
            filteredYear) && (
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
          <Select
            placeholder="country..."
            options={countries}
            value={filteredCountryISOA2 || ''}
            onChange={(value) =>
              value === filteredCountryISOA2
                ? setCountryISOA2Filter(null)
                : setCountryISOA2Filter(value as string | null)
            }
            valueKey="isoA2"
            renderLabel={(d) => <CountryLabel country={d} />}
          />
          {filteredCountry && (
            <div className="flex flex-row items-center justify-between gap-2 mt-1">
              <Link href={filteredCountry.path!} className="text-xs">
                See{' '}
                <span className="font-medium link hover:bg-snot-300">{filteredCountry.name}</span> →
              </Link>
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
          <Select
            placeholder="category..."
            options={categories}
            valueKey="slug"
            renderLabel={(d) => <CategoryLabel category={d} />}
            value={filteredCategorySlug || ''}
            onChange={(value) =>
              value === filteredCategorySlug
                ? setCategoryFilter(null)
                : setCategoryFilter(value || null)
            }
          />

          {filteredCategory && (
            <div className="flex flex-row items-center justify-between gap-2 mt-1">
              <Link href={filteredCategory.path!} className="text-xs">
                See{' '}
                <span className="font-medium link hover:bg-snot-300">{filteredCategory.name}</span>{' '}
                →
              </Link>
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
          <Select
            placeholder="company..."
            options={companies}
            value={filteredCompanySlug || ''}
            onChange={(value) =>
              value === filteredCompanySlug
                ? setCompanyFilter(null)
                : setCompanyFilter(value || null)
            }
            valueKey="slug"
            renderLabel={(d) => <CompanyLabel company={d} />}
          />
          {!!filteredCompany && (
            <div className="flex flex-row items-center justify-between gap-2 mt-1">
              <Link href={filteredCompany.path!} className="text-xs" key={filteredCompany.id}>
                See{' '}
                <span className="font-medium link hover:bg-snot-300">{filteredCompany.name}</span> →
              </Link>
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
          <Select
            placeholder="union..."
            options={organisingGroups}
            valueKey="slug"
            renderLabel={(d) => <OrganisingGroupLabel organisingGroup={d} />}
            value={filteredOrganisingGroupSlug || ''}
            onChange={(value) =>
              value === filteredOrganisingGroupSlug
                ? setOrganisingGroupFilter(null)
                : setOrganisingGroupFilter(value || null)
            }
          />
          {!!filteredOrganisingGroup && (
            <div className="flex flex-row items-center justify-between gap-2 mt-1">
              <Link
                href={filteredOrganisingGroup.path!}
                className="text-xs"
                key={filteredOrganisingGroup.id}
              >
                See{' '}
                <span className="font-medium link hover:bg-snot-300">
                  {filteredOrganisingGroup.name}
                </span>{' '}
                →
              </Link>
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
          <Select
            placeholder="campaign..."
            options={campaigns}
            valueKey="slug"
            renderLabel={(d) => <CampaignLabel campaign={d} />}
            value={filteredCampaignSlug || ''}
            onChange={(value) =>
              value === filteredCampaignSlug
                ? setCampaignFilter(null)
                : setCampaignFilter(value || null)
            }
          />
          {filteredCampaign && (
            <div className="flex flex-row items-center justify-between gap-2 mt-1">
              <Link href={filteredCampaign.path!} className="text-xs">
                See{' '}
                <span className="font-medium link hover:bg-snot-300">{filteredCampaign.name}</span>{' '}
                →
              </Link>
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
          <Select
            placeholder="year..."
            valueKey="value"
            renderLabel={(d) => <span>{d.value.toString()}</span>}
            options={years.map((year) => ({
              label: year.toString(),
              value: year.toString(),
            }))}
            value={filteredYear?.toString() || ''}
            onChange={(value) =>
              value === filteredYear?.toString()
                ? setYearFilter(null)
                : setYearFilter(value || null)
            }
          />
          {filteredYear && (
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

function Select<T, K extends keyof T>({
  options,
  value,
  onChange,
  valueKey,
  renderLabel,
  placeholder = 'Select...',
}: {
  options: T[]
  value: string | null
  valueKey: K
  onChange: (value: T[K]) => void
  renderLabel: (item: T) => React.ReactNode
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedItem = options.find((option) => option[valueKey] === value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={twMerge('w-full justify-between overflow-hidden', value && 'bg-snot-300')}
        >
          {selectedItem ? renderLabel(selectedItem) : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command value={value || undefined}>
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option[valueKey]?.toString() || ''}
                  onSelect={() => {
                    onChange(option[valueKey])
                    setOpen(false)
                  }}
                >
                  {renderLabel(option)}
                  <Check
                    className={cn(
                      'ml-auto',
                      value === option[valueKey] ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
