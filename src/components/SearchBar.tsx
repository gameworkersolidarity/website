'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { SearchIcon } from 'lucide-react'
import type { Action, Company, Country, Category, OrganisingGroup } from '@/payload-types'
import { CountryLabel } from './CountryLabel'
import { CompanyLabel } from './CompanyLabel'
import { CategoryLabel } from './CategoryLabel'
import { OrganisingGroupLabel } from './OrganisingGroupLabel'
import { ActionMetadata } from './ActionCard'
import { DateTime } from './DateTime'
import { formatDate } from 'date-fns'

interface SearchResults {
  actions: Action[]
  unions: OrganisingGroup[]
  companies: Company[]
  countries: Country[]
  categories: Category[]
}

const fetcher = async (url: string): Promise<SearchResults> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Search failed')
  }
  return response.json()
}

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const router = useRouter()

  // Debounce query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Use SWR for data fetching
  const searchKey = debouncedQuery.trim()
    ? `/api/search?q=${encodeURIComponent(debouncedQuery.trim())}`
    : null

  const { data: results, isLoading } = useSWR<SearchResults>(searchKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
  })

  const searchResults = results || {
    actions: [],
    unions: [],
    companies: [],
    countries: [],
    categories: [],
  }

  const handleSelect = (url: string) => {
    setOpen(false)
    setQuery('')
    router.push(url)
  }

  // Reset search when dialog closes
  // useEffect(() => {
  //   if (!open) {
  //     setQuery('')
  //     setDebouncedQuery('')
  //   }
  // }, [open])

  const hasResults =
    searchResults.actions.length > 0 ||
    searchResults.unions.length > 0 ||
    searchResults.companies.length > 0 ||
    searchResults.countries.length > 0 ||
    searchResults.categories.length > 0

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex items-center gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 cursor-pointer"
        aria-label="Search"
      >
        <SearchIcon className="w-3 h-3 text-foreground" />
        <span className="hidden sm:inline">Search</span>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        shouldFilter={false}
        className="z-100"
      >
        <CommandInput
          placeholder="Search for actions, unions, companies, countries, categories..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && debouncedQuery && (
            <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
          )}
          {!isLoading && !hasResults && debouncedQuery && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {!debouncedQuery && <CommandEmpty>Type to search...</CommandEmpty>}
          {!isLoading && hasResults && (
            <>
              {searchResults.unions.length > 0 && (
                <CommandGroup heading="Unions">
                  {searchResults.unions.map((union) => (
                    <CommandItem
                      key={union.id}
                      className="py-2!"
                      onSelect={() => handleSelect(union.path || union.url || '/')}
                    >
                      <OrganisingGroupLabel organisingGroup={union} link={false} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {searchResults.companies.length > 0 && (
                <CommandGroup heading="Companies">
                  {searchResults.companies.map((company) => (
                    <CommandItem
                      key={company.id}
                      className="py-2!"
                      onSelect={() => handleSelect(company.path || company.url || '/')}
                    >
                      <CompanyLabel company={company} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {searchResults.countries.length > 0 && (
                <CommandGroup heading="Countries">
                  {searchResults.countries.map((country) => (
                    <CommandItem
                      key={country.id}
                      className="py-2!"
                      onSelect={() => handleSelect(country.path || country.url || '/')}
                    >
                      <CountryLabel country={country} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {searchResults.categories.length > 0 && (
                <CommandGroup heading="Categories">
                  {searchResults.categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      className="py-2!"
                      onSelect={() => handleSelect(category.path || category.url || '/')}
                    >
                      <CategoryLabel category={category} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {searchResults.actions.length > 0 && (
                <CommandGroup heading="Actions">
                  {searchResults.actions.map((action) => (
                    <CommandItem
                      key={action.id}
                      className="py-2!"
                      onSelect={() => handleSelect(action.path || action.url || '/')}
                    >
                      <div className="flex flex-row gap-2 w-full overflow-hidden truncate items-baseline">
                        <DateTime
                          date={action.date}
                          className="font-mono text-zinc-500 uppercase text-xs"
                        />
                        <div className="col-span-4">{action.name}</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
