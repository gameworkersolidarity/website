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
import { useQueryState } from 'nuqs'
import type { Country, Category, Company, OrganisingGroup } from '@/payload-types'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

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
      <span className="filter-label">Filter by</span>
      <div className="flex flex-row gap-2">
        <div className="filter-group">
          <Select
            placeholder="Select country..."
            options={countries.map((country) => ({
              label: country.name,
              value: country.id.toString(),
            }))}
            value={countryFilter || ''}
            onChange={(value) => setCountryFilter(value || null)}
          />
        </div>
        <div className="filter-group">
          <Select
            placeholder="Select category..."
            options={categories.map((category) => ({
              label: (category.emoji && `${category.emoji} ` + category.name) || category.name,
              value: category.id.toString(),
            }))}
            value={categoryFilter || ''}
            onChange={(value) => setCategoryFilter(value || null)}
          />
        </div>
        <div className="filter-group">
          <Select
            placeholder="Select company..."
            options={companies.map((company) => ({
              label: company.name,
              value: company.id.toString(),
            }))}
            value={companyFilter || ''}
            onChange={(value) => setCompanyFilter(value || null)}
          />
        </div>
        <div className="filter-group">
          <Select
            placeholder="Select union..."
            options={organisingGroups
              .filter((group) => group.isUnion)
              .map((group) => ({
                label: group.name,
                value: group.id.toString(),
              }))}
            value={unionFilter || ''}
            onChange={(value) => setUnionFilter(value || null)}
          />
        </div>
        <div className="filter-group">
          <Select
            placeholder="Select year..."
            options={years.map((year) => ({
              label: year.toString(),
              value: year.toString(),
            }))}
            value={yearFilter || ''}
            onChange={(value) => setYearFilter(value || null)}
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
          className="w-[200px] justify-between"
        >
          {selectedItem ? renderLabel(selectedItem) : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
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
