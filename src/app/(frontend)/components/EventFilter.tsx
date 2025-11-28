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
import type { Country, Category, Company, OrganisingGroup } from '@/payload-types'
import { useState } from 'react'
import {
  useCategoryFilter,
  useYearFilter,
  useCompanyFilter,
  useUnionFilter,
  useCountryFilter,
} from '@/utils/global-state'
import { twMerge } from 'tailwind-merge'

interface EventFilterProps {
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  // searchQuery: string
  // setSearchQuery: (value: string) => void
}

export function EventFilter({
  countries,
  categories,
  companies,
  organisingGroups,
  // searchQuery,
  // setSearchQuery,
}: EventFilterProps) {
  const [countryFilter, setCountryFilter] = useCountryFilter()
  const [categoryFilter, setCategoryFilter] = useCategoryFilter()
  const [companyFilter, setCompanyFilter] = useCompanyFilter()
  const [unionFilter, setUnionFilter] = useUnionFilter()
  const [yearFilter, setYearFilter] = useYearFilter()

  // Get unique years from all actions (we'll calculate this from context or pass as prop)
  // For now, we'll generate years from 2018 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2017 }, (_, i) => currentYear - i)

  return (
    <div className="homepage-filters">
      <h2 className="filter-label mb-2 font-bold">Filter by</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 w-full">
        <div className="filter-group w-full">
          <Select
            placeholder="Filter country..."
            options={countries.map((country) => ({
              label: country.name,
              value: country.slug,
            }))}
            value={countryFilter || ''}
            onChange={(value) =>
              value === countryFilter ? setCountryFilter(null) : setCountryFilter(value || null)
            }
          />
          {countryFilter && (
            <div className="link text-xs mt-1" onClick={() => setCountryFilter(null)}>
              Reset ⤬
            </div>
          )}
        </div>
        <div className="filter-group w-full">
          <Select
            placeholder="Filter category..."
            options={categories.map((category) => ({
              label: (category.emoji && `${category.emoji} ` + category.name) || category.name,
              value: category.slug,
            }))}
            value={categoryFilter || ''}
            onChange={(value) =>
              value === categoryFilter ? setCategoryFilter(null) : setCategoryFilter(value || null)
            }
          />
          {categoryFilter && (
            <div className="link text-xs mt-1" onClick={() => setCategoryFilter(null)}>
              Reset ⤬
            </div>
          )}
        </div>
        <div className="filter-group w-full">
          <Select
            placeholder="Filter company..."
            options={companies.map((company) => ({
              label: company.name,
              value: company.slug,
            }))}
            value={companyFilter || ''}
            onChange={(value) =>
              value === companyFilter ? setCompanyFilter(null) : setCompanyFilter(value || null)
            }
          />
          {companyFilter && (
            <div className="link text-xs mt-1" onClick={() => setCompanyFilter(null)}>
              Reset ⤬
            </div>
          )}
        </div>
        <div className="filter-group w-full">
          <Select
            placeholder="Filter union..."
            options={organisingGroups.map((group) => ({
              label: group.name,
              value: group.slug,
            }))}
            value={unionFilter || ''}
            onChange={(value) =>
              value === unionFilter ? setUnionFilter(null) : setUnionFilter(value || null)
            }
          />
          {unionFilter && (
            <div className="link text-xs mt-1" onClick={() => setUnionFilter(null)}>
              Reset ⤬
            </div>
          )}
        </div>
        <div className="filter-group w-full">
          <Select
            placeholder="Filter year..."
            options={years.map((year) => ({
              label: year.toString(),
              value: year.toString(),
            }))}
            value={yearFilter || ''}
            onChange={(value) =>
              value === yearFilter ? setYearFilter(null) : setYearFilter(value || null)
            }
          />
          {yearFilter && (
            <div className="link text-xs mt-1" onClick={() => setYearFilter(null)}>
              Reset ⤬
            </div>
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

function defaultRenderLabel(item: { label: string; value: string }) {
  return item.label
}

function Select({
  options,
  value,
  renderLabel = defaultRenderLabel,
  onChange,
  placeholder = 'Select...',
}: {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  renderLabel?: (item: { label: string; value: string }) => string
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
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
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
