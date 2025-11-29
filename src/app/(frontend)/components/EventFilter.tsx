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
import {
  useCategoryFilter,
  useYearFilter,
  useCompanyFilter,
  useUnionFilter,
  useCountryISOA2Filter,
  useCampaignFilter,
  useInitiatorFilter,
} from '@/utils/global-state'
import { twMerge } from 'tailwind-merge'
import Emoji from 'a11y-react-emoji'
import { EventInitiator } from '@/collections/enums'
import { DisplayInitiator } from '@/utils/displayInitiator'
import { useEventFilterContext } from '@/components/EventFilterContextProvider'
import Link from 'next/link'

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
    countryFilter,
    filteredCountry,
    setCountryISOA2Filter,
    categoryFilter,
    filteredCategory,
    setCategoryFilter,
    companyFilter,
    filteredCompany,
    setCompanyFilter,
    unionFilter,
    filteredUnion,
    setUnionFilter,
    campaignFilter,
    filteredCampaign,
    setCampaignFilter,
    initiatorFilter,
    setInitiatorFilter,
    yearFilter,
    setYearFilter,
  } = useEventFilterContext()

  // Get unique years from all actions (we'll calculate this from context or pass as prop)
  // For now, we'll generate years from 2018 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2017 }, (_, i) => currentYear - i)

  return (
    <div className="homepage-filters">
      <div className="flex flex-row items-baseline gap-2 mb-2">
        <h2 className="font-bold">Filter by</h2>
        {(countryFilter ||
          categoryFilter ||
          companyFilter ||
          unionFilter ||
          campaignFilter ||
          initiatorFilter ||
          yearFilter) && (
          <div
            className="link"
            onClick={() => {
              setCountryISOA2Filter(null)
              setCategoryFilter(null)
              setCompanyFilter(null)
              setUnionFilter(null)
              setCampaignFilter(null)
              setInitiatorFilter(null)
              setYearFilter(null)
            }}
          >
            clear filters ⤬
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 w-full">
        <div className="filter-group w-full">
          <Select
            placeholder="country..."
            options={countries.map((country) => ({
              label: country.name,
              value: country.isoA2,
            }))}
            value={countryFilter || ''}
            onChange={(value) =>
              value === countryFilter
                ? setCountryISOA2Filter(null)
                : setCountryISOA2Filter(value || null)
            }
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
            options={categories.map((category) => ({
              label: category.name,
              value: category.slug,
              emoji: category.emoji,
            }))}
            renderLabel={(d) => (
              <span className="flex items-center gap-1 capitalize">
                {d.emoji && <Emoji symbol={d.emoji} />}
                {d.label}
              </span>
            )}
            value={categoryFilter || ''}
            onChange={(value) =>
              value === categoryFilter ? setCategoryFilter(null) : setCategoryFilter(value || null)
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
            options={companies.map((company) => ({
              label: company.name,
              value: company.slug,
            }))}
            value={companyFilter || ''}
            onChange={(value) =>
              value === companyFilter ? setCompanyFilter(null) : setCompanyFilter(value || null)
            }
          />
          {!!filteredCompany && (
            <div className="flex flex-row items-center justify-between gap-2 mt-1">
              {filteredCompany.descendants.map((descendant) => (
                <Link href={descendant.path!} className="text-xs" key={descendant.id}>
                  See <span className="font-medium link hover:bg-snot-300">{descendant.name}</span>{' '}
                  →{JSON.stringify(descendant)}
                </Link>
              ))}
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
            options={organisingGroups.map((group) => ({
              label: group.name,
              value: group.slug,
            }))}
            value={unionFilter || ''}
            onChange={(value) =>
              value === unionFilter ? setUnionFilter(null) : setUnionFilter(value || null)
            }
          />
          {!!filteredUnion && (
            <div className="flex flex-row items-center justify-between gap-2 mt-1">
              {filteredUnion.descendants.map((descendant) => (
                <Link href={descendant.path!} className="text-xs" key={descendant.id}>
                  See <span className="font-medium link hover:bg-snot-300">{descendant.name}</span>{' '}
                  →
                </Link>
              ))}
              <span
                className="text-xs link"
                onClick={() => {
                  setUnionFilter(null)
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
            options={campaigns.map((campaign) => ({
              label: campaign.name,
              value: campaign.slug,
            }))}
            value={campaignFilter || ''}
            onChange={(value) =>
              value === campaignFilter ? setCampaignFilter(null) : setCampaignFilter(value || null)
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
            options={years.map((year) => ({
              label: year.toString(),
              value: year.toString(),
            }))}
            value={yearFilter || ''}
            onChange={(value) =>
              value === yearFilter ? setYearFilter(null) : setYearFilter(value || null)
            }
          />
        </div>
        <div className="filter-group w-full">
          <Select
            placeholder="initiator..."
            options={Object.values(EventInitiator).map((initiator) => ({
              label: initiator.charAt(0).toUpperCase() + initiator.slice(1),
              value: initiator,
            }))}
            renderLabel={(d) => <DisplayInitiator initiator={d.value as EventInitiator} />}
            value={initiatorFilter || ''}
            onChange={(value) =>
              value === initiatorFilter
                ? setInitiatorFilter(null)
                : setInitiatorFilter(value as EventInitiator)
            }
          />
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

function defaultRenderLabel(item: { label: string; value: string }) {
  return item.label
}

function Select<T extends { label: string; value: string }>({
  options,
  value,
  renderLabel = defaultRenderLabel,
  onChange,
  placeholder = 'Select...',
}: {
  options: T[]
  value: string
  onChange: (value: string) => void
  renderLabel?: (item: T) => React.ReactNode
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedItem = options.find((option) => option.value === value)
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
        <Command value={value}>
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {renderLabel(option)}
                  <Check
                    className={cn('ml-auto', value === option.value ? 'opacity-100' : 'opacity-0')}
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
