import { SolidarityActionsList } from '../components/SolidarityActions';
import { SolidarityAction, CountryEmoji, Company, Category, Country, OrganisingGroup } from '../data/types';
import Link from 'next/link';
import { projectStrings } from '../data/site';
import { Map } from '../components/Map';
import { CumulativeMovementChart } from '../components/ActionChart';
import { useMemo, useState, createContext, useEffect } from 'react';
import Fuse from 'fuse.js';
import Emoji from 'a11y-react-emoji';
import pluralize from 'pluralize';
import { useURLStateFactory } from '../utils/state';
import { ensureArray, toggleInArray, stringifyArray } from '../utils/string';
import { Listbox, Disclosure } from '@headlessui/react'
import { useRouter } from 'next/dist/client/router';
import useSWR from 'swr';
import { useContextualRouting } from 'next-use-contextual-routing';
import { OrganisingGroupCard, OrganisingGroupDialog, useSelectedOrganisingGroup } from '../components/OrganisingGroup';
import { UnionsByCountryData } from '../pages/api/organisingGroupsByCountry';
import { ChevronRightIcon } from '@heroicons/react/outline';
import { scrollToYear } from '../utils/router';
import { groupUrl } from '../data/organisingGroup';
import cx from 'classnames';
import { groupBy } from 'lodash';
import { FilterButton, FilterOption } from './Filter';
import {memoize} from 'lodash'

export const FilterContext = createContext<{
  search?: string
  matches: Fuse.FuseResult<SolidarityAction>[],
  categories?: string[]
  countries?: string[]
  companies?: string[]
  groups?: string[]
  hasFilters: boolean
}>({ matches: [], hasFilters: false })

export function SolidarityActionsTimeline ({
  actions,
  companies,
  categories,
  countries,
  groups
}: {
  actions: SolidarityAction[],
  companies: Company[],
  categories: Category[],
  countries: Country[],
  groups: OrganisingGroup[]
}) {
  const router = useRouter()
  const useURLState = useURLStateFactory()

  /**
   * Categories
   */
  const [filteredCategoryNames, setCategories, categoryMetadata] = useURLState<string[]>({
    key: 'category',
    emptyValue: [],
    serialiseObjectToState: (key, urlData) => urlData ? ensureArray(urlData) as string[] : [],
  })
  const toggleCategory = (category: string) => {
    setCategories(categories => toggleInArray(categories, category))
  }
  const selectedCategories = useMemo(() =>
    filteredCategoryNames.map(name => categories.find(c => c.fields.Name === name)!).filter(Boolean),
  [filteredCategoryNames])

  /**
   * Companies
   */
  const [filteredCompanyNames, setCompanies, companiesMetadata] = useURLState({
    key: 'company',
    emptyValue: [],
    serialiseObjectToState: (key, urlData) => urlData ? ensureArray(urlData) as string[] : [],
  })
  const toggleCompany = (id: string) => {
    setCompanies(companies => toggleInArray(companies, id))
  }
  const selectedCompanies = useMemo(() =>
    filteredCompanyNames.map(name => companies.find(c => c.fields.Name === name)!).filter(Boolean),
  [filteredCompanyNames])

  /**
   * Countries
   */
  const [filteredCountrySlugs, setCountries, countriesMetadata] = useURLState({
    key: 'country',
    emptyValue: [],
    serialiseObjectToState: (key, urlData) => urlData ? ensureArray(urlData) as string[] : []
  })
  const toggleCountry = (id: string) => {
    setCountries(countries => toggleInArray(countries, id))
  }
  const selectedCountries = useMemo(() =>
    filteredCountrySlugs.map(slug => countries.find(c => c.fields.Slug === slug)!).filter(Boolean),
  [filteredCountrySlugs])

  /**
   * OrganisingGroups
   */
  const [filteredOrganisingGroupNames, setOrganisingGroups, organisingGroupMetadata] = useURLState({
    key: 'group',
    emptyValue: [],
    serialiseObjectToState: (key, urlData) => urlData ? ensureArray(urlData) as string[] : [],
  })
  const toggleOrganisingGroup = (id: string) => {
    setOrganisingGroups(groups => toggleInArray(groups, id))
  }
  const selectedOrganisingGroups = useMemo(() =>
    filteredOrganisingGroupNames.map(name => groups.find(c => c.fields.Name === name)!).filter(Boolean),
  [filteredOrganisingGroupNames])

  /**
   * Full text search
   */
  const [filterText, setFilterText, filterTextMetadata] = useURLState<string>({
    key: 'search',
    emptyValue: '',
    serialiseObjectToState: (key, urlData) => urlData?.toString() || ''
  })

  /**
   * Filter metadata
   */
  const hasFilters = !!(filterText.length || selectedOrganisingGroups.length || selectedCountries.length || selectedCompanies.length || selectedCategories.length)

  const clearAllFilters = () => {
    setFilterText(filterTextMetadata.emptyValue)
    setCountries(countriesMetadata.emptyValue)
    setCategories(categoryMetadata.emptyValue)
    setCompanies(companiesMetadata.emptyValue)
    setOrganisingGroups(organisingGroupMetadata.emptyValue)
  }

  /**
   * Filtering
   */
  const [matches, setMatches] = useState<Fuse.FuseResult<SolidarityAction>[]>([])
  const search = useMemo(() => new Fuse(actions, {
    keys: [
      'fields.Category',
      'fields.Company',
      'fields.Country',
      'fields.Name',
      'fields.Location',
      'fields.geography.location.display_name',
      'summary.plaintext',
      'fields.CategoryName',
      'fields.countryName',
      'fields.companyName',
      ["fields", "Organising Groups"],
      'fields.organisingGroupName'
    ],
    threshold: 0.01,
    ignoreLocation: true,
    includeMatches: true,
    minMatchCharLength: 2,
    findAllMatches: true,
    shouldSort: false,
    useExtendedSearch: true
  }), [actions])

  const defaults = {
    updateMatches: false,
    selectedCategories,
    selectedCompanies,
    selectedCountries,
    selectedOrganisingGroups,
    filterText,
  }

  function filterActions (params: Partial<typeof defaults> = defaults) {
    const {
      selectedCategories,
      selectedCompanies,
      selectedCountries,
      selectedOrganisingGroups,
      filterText,
    } = params
    const expression: Fuse.Expression = { $and: [] }
    if (selectedCategories?.length) {
      expression.$and!.push({ $or: selectedCategories.map(c => ({ 'fields.Category': `'${c?.id}` })) })
    }
    if (selectedCompanies?.length) {
      expression.$and!.push({ $or: selectedCompanies.map(c => ({ 'fields.Company': `'${c?.id}` })) })
    }
    if (selectedCountries?.length) {
      expression.$and!.push({ $or: selectedCountries.map(c => ({ 'fields.Country': `'${c?.id}` })) })
    }
    if (selectedOrganisingGroups?.length) {
      expression.$and!.push({ $or: selectedOrganisingGroups.map(c => ({ $path: ['fields', "Organising Groups"], $val: `'${c?.id}` })) })
    }
    if (filterText?.trim().length) {
      expression.$and!.push({
        $or: [
          { 'fields.Name': `'"${filterText}"` },
          { 'summary.plaintext': `'"${filterText}"` },
          { 'fields.Location': `'"${filterText}"` },
          { 'fields.geography.location.displayname': `'"${filterText}"` },
          { 'fields.CategoryName': `'"${filterText}"` },
          { 'fields.countryName': `'"${filterText}"` },
          { 'fields.companyName': `'"${filterText}"` },
          { 'fields.organisingGroupName': `'"${filterText}"` },
        ]
      })
    }
    return search.search(expression)
  }

  const filterActionCount = memoize((params: Partial<typeof defaults> = defaults): number => {
    return filterActions(params).length
  }, (arg) => JSON.stringify(arg))

  function updateFilteredActions () {
    const hasFilters = !!(filterText.length || selectedOrganisingGroups.length || selectedCountries.length || selectedCompanies.length || selectedCategories.length)
    if (!hasFilters) return actions
    const results = filterActions()
    setMatches(results)
    return results.map(s => s.item)
  }

  const filteredActions = useMemo(() => {
    return updateFilteredActions()
  }, [actions, search, hasFilters, filterText, selectedCategories, selectedCompanies, selectedOrganisingGroups, selectedCountries])
  

  useEffect(() => {
    if (hasFilters) {
      window.scroll({
        top: document.getElementById('static-header')?.offsetHeight || 100,
        behavior: 'smooth'
      })
    }
  }, [hasFilters])

  const relevantGroups = Array.from(new Set(
    filteredActions
      .reduce((gs, a) => gs.concat(a.fields['Organising Groups'] || []), [] as string[])
    ))
    .map(gid => groups.find(G => G.id === gid)!)
    .filter(Boolean)

  const UNION_DISPLAY_LIMIT = 3
  const { makeContextualHref, returnHref } = useContextualRouting();
  const [selectedUnion, unionDialogKey] = useSelectedOrganisingGroup(groups || [])

  /**
   * Render
   */
  return (
    <FilterContext.Provider value={{
      matches,
      search: filterText,
      categories: filteredCategoryNames,
      countries: filteredCountrySlugs,
      companies: filteredCompanyNames,
      hasFilters
    }}>
      <OrganisingGroupDialog data={selectedUnion} onClose={() => { router.push(returnHref, undefined, { shallow: true, scroll: false }) }} />
      <div className="flex flex-col lg:flex-row">
        <section className='relative bg-white flex-1'>
          <div className='p-4 lg:p-5 xl:pl-7 flex flex-col flex-nowrap md:h-screen sticky top-5 space-y-4'>
            <section className='flex-grow-0'>
              <div className='flex flex-wrap w-full justify-between text-sm'>
                <h3 className='text-base text-left left-0 font-semibold mb-2'>
                  Filter by
                </h3>
                {hasFilters ? (
                  <div className='cursor-pointer rounded-lg inline-block hover:text-gwPink'
                    onClick={clearAllFilters}
                  >
                    <span className='underline'>Clear all filters</span>
                    &nbsp;
                    <span className='inline-block transform rotate-45 text-base'>+</span>
                  </div>
                ) : null}
              </div>
              <div className='relative flex flex-wrap w-full'>
                <div className='filter-item'>
                  <Listbox value={filteredCountrySlugs} onChange={v => toggleCountry(v as any)}>
                  {({ open }) => (
                    <>
                    <Listbox.Button>
                      <FilterButton label='Country' selectionCount={selectedCountries.length} isOpen={open} />
                    </Listbox.Button>
                    <Listbox.Options>
                      <div className='listbox-dropdown'>
                        {countries.map((country) => {
                          const isSelected = !!selectedCountries.find(c => c?.id === country.id)
                          
                          const numberOfSolidarityActionsInCountry = country.fields['Solidarity Actions']?.length || 0
                          
                          return (
                            <Listbox.Option
                              key={country.id}
                              value={country.fields.Slug}
                              disabled={!numberOfSolidarityActionsInCountry && !isSelected}
                            >
                              {(args) => (
                                <FilterOption {...args} selected={isSelected} disabled={!numberOfSolidarityActionsInCountry}>
                                  <span aria-role='hidden' className='hidden'>
                                    {/* This allows type-ahead on the keyboard for the dropdown */}
                                    {country.fields.Name}
                                  </span>
                                  <span><Emoji symbol={country.emoji.emoji} /></span>
                                  <span className='text-sm ml-1 inline-block'>{country.fields.Name}</span>
                                  <span className='inline-block align-baseline text-xs ml-auto pl-3'>
                                  {numberOfSolidarityActionsInCountry}
                                  </span>
                                </FilterOption>
                              )}
                            </Listbox.Option>
                          )
                        })}
                      </div>
                    </Listbox.Options>
                    </>
                  )}
                  </Listbox>
                </div>
                <div className='filter-item'>
                  <Listbox value={filteredCategoryNames} onChange={v => toggleCategory(v as any)}>
                  {({ open }) => (
                    <>
                    <Listbox.Button>
                      <FilterButton label='Category' selectionCount={selectedCategories.length} isOpen={open} />
                    </Listbox.Button>
                    <Listbox.Options>
                      <div className='listbox-dropdown'>
                        {categories.map((category) => {
                          const countIfYouIncludeThis = !hasFilters
                          ? category.fields['Solidarity Actions']?.length || 0
                          : filterActionCount({
                            ...defaults,
                            selectedCategories: [...selectedCategories, category]
                          })
                          const isSelected = !!selectedCategories.find(c => c?.id === category.id)
                          return (
                            <Listbox.Option
                              key={category.id}
                              value={category.fields.Name}
                              disabled={!countIfYouIncludeThis && !isSelected}
                            >
                              {(args) =>  {
                                return (
                                  <FilterOption {...args} selected={isSelected} disabled={!countIfYouIncludeThis}>
                                    <span aria-role='hidden' className='hidden'>
                                      {/* This allows type-ahead on the keyboard for the dropdown */}
                                      {category.fields.Name}
                                    </span>
                                    <span className='text-sm inline-block align-baseline'>{category.fields.Emoji}</span>
                                    <span className='text-sm inline-block align-baseline capitalize ml-1'>{category.fields.Name}</span>
                                    <span className='align-baseline inline-block text-xs ml-auto pl-3'>
                                    {/* {pluralize('action', countIfYouIncludeThis, true)} */}
                                    {countIfYouIncludeThis}
                                    </span>
                                  </FilterOption>
                                )
                              }}
                            </Listbox.Option>
                          )
                        })}
                      </div>
                    </Listbox.Options>
                    </>
                  )}
                  </Listbox>
                </div>
                <div className='filter-item'>
                  <Listbox value={filteredCompanyNames} onChange={v => toggleCompany(v as any)}>
                  {({ open }) => (
                    <>
                    <Listbox.Button>
                      <FilterButton label='Company' selectionCount={selectedCompanies.length} isOpen={open} />
                    </Listbox.Button>
                    <Listbox.Options>
                      <div className='listbox-dropdown'>
                        {companies.map((company) =>  {
                          const isSelected = !!selectedCompanies.find(c => c?.id === company.id)
                          const countIfYouIncludeThis = !hasFilters
                          ? company.fields['Solidarity Actions']?.length || 0
                          : filterActionCount({
                            ...defaults,
                            selectedCompanies: [...selectedCompanies, company]
                          })
                          return (
                            <Listbox.Option
                              key={company.id}
                              value={company.fields.Name}
                              disabled={!countIfYouIncludeThis && !isSelected}
                            >
                              {(args) => (
                                <FilterOption {...args} selected={isSelected} disabled={!countIfYouIncludeThis}>
                                  <span className='text-sm inline-block align-baseline'>{company.fields.Name}</span>
                                  <span className='align-baseline inline-block text-xs ml-auto pl-3'>
                                  {/* {pluralize('action', countIfYouIncludeThis, true)} */}
                                  {countIfYouIncludeThis}
                                  </span>
                                </FilterOption>
                              )}
                            </Listbox.Option>
                          )
                        })}
                      </div>
                    </Listbox.Options>
                    </>
                  )}
                  </Listbox>
                </div>
                <div className='filter-item'>
                  <Listbox value={filteredOrganisingGroupNames} onChange={v => toggleOrganisingGroup(v as any)}>
                  {({ open }) => (
                    <>
                    <Listbox.Button>
                      <FilterButton label='Union' selectionCount={selectedOrganisingGroups.length} isOpen={open} />
                    </Listbox.Button>
                    <Listbox.Options>
                      <div className='listbox-dropdown'>
                        {groups.map((group) => {
                          const isSelected = !!selectedOrganisingGroups.find(c => c?.id === group.id)
                          const countIfYouIncludeThis = !hasFilters
                          ? group.fields['Solidarity Actions']?.length || 0
                          : filterActionCount({
                            ...defaults,
                            selectedOrganisingGroups: [...selectedOrganisingGroups, group]
                          })
                          return (
                            <Listbox.Option
                              key={group.id}
                              value={group.fields.Name}
                              disabled={!countIfYouIncludeThis && !isSelected}
                            >
                              {(args) => {
                                return (
                                  <FilterOption {...args} selected={isSelected} disabled={!countIfYouIncludeThis}>
                                    <span className='text-sm inline-block align-baseline'>{group.fields.Name}</span>
                                    <span className='align-baseline inline-block text-xs ml-auto pl-3'>
                                      {/* {pluralize('action', countIfYouIncludeThis, true)} */}
                                      {countIfYouIncludeThis}
                                    </span>
                                  </FilterOption>
                                )
                              }}
                            </Listbox.Option>
                          )
                        })}
                      </div>
                    </Listbox.Options>
                    </>
                  )}
                  </Listbox>
                </div>
                <div className='filter-item flex-grow'>
                  <input
                    placeholder='Search'
                    type='search' 
                    value={filterText}
                    onChange={e => setFilterText(e.target.value.trimStart())}
                    className='rounded-lg border-2 border-gray-300 px-3 py-2 text-sm font-semibold w-full hover:shadow-innerGwPink hover:border-2 hover:border-gwPink focus:border-gwPink transition duration-75'
                  />
                </div>
              </div>
            </section>
            <section className='w-full flex-grow h-[40vh] md:h-auto'>
              <Map data={JSON.parse(JSON.stringify(filteredActions))} onSelectCountry={iso2 => {
                const countrySlug = countries.find(c => c.fields.countryCode === iso2)?.fields.Slug
                if (countrySlug) {
                  toggleCountry(countrySlug)
                }
              }} />
            </section>
            <section className='pt-1 flex-grow-0'>
              <h3 className='text-base text-left w-full font-semibold'>
                Select year
              </h3>
              <CumulativeMovementChart data={filteredActions} onSelectYear={year => scrollToYear(router, year)} />
            </section>
          </div>
        </section>

        <section className='p-4 lg:p-5 xl:pr-7 space-y-4 flex-1'>
          <h2 className='text-6xl font-identity'>
            {pluralize('action', filteredActions.length, true)}
          </h2>

          {!!relevantGroups.length && hasFilters && (
            <article>
              <h3 className='text-3xl font-light font-identity'>Related unions and groups</h3>
              <ul className='list space-y-1 my-3'>
                <Disclosure>
                  {({ open }) => (
                    <>
                      {relevantGroups.slice(0, open ? 1000 : UNION_DISPLAY_LIMIT).map(union =>
                        <Link
                          href={makeContextualHref({ [unionDialogKey]: union.id })}
                          as={groupUrl(union)}
                          shallow
                          key={union.id}
                        >
                          <li className='space-x-1'>
                            <Emoji
                              symbol={categories.find(c => c.fields.Name === 'union')?.fields.Emoji || '🤝'}
                              label={union.fields.IsUnion ? 'Union' : 'Organising Group'}
                            />
                            <span className='link'>{union.fields.Name}</span>
                            <span>
                              <span className='inline-block ml-2 text-gray-400 rounded-full text-xs'>
                                {union.fields.IsUnion ? 'Union' : 'Organising group'} in
                              </span>
                              &nbsp;
                              <span className='inline-block text-gray-400 rounded-full text-xs'>
                                {stringifyArray(union.geography.country.map(g => g.name))}
                              </span>
                            </span>
                          </li>
                        </Link>
                      )}
                      {(relevantGroups.length || 0) > UNION_DISPLAY_LIMIT && (
                        <Disclosure.Button>
                          <div className='text-sm link px-2 my-2'>
                            <span>{open
                              ? "Show fewer"
                              : `Show ${relevantGroups.length - UNION_DISPLAY_LIMIT} more`
                            }</span>
                            <ChevronRightIcon
                              className={`${open ? "-rotate-90" : "rotate-90"} transform w-3 inline-block`}
                            />
                          </div>
                        </Disclosure.Button>
                      )}
                    </>
                  )}
                </Disclosure>
              </ul>
            </article>
          )}

          {selectedCategories.filter(c => c?.summary?.html).map(c => (
            <article>
              <h3 className='text-3xl font-identity'>More info on {c.fields.Name}</h3>
              <div className='prose' dangerouslySetInnerHTML={{ __html: c?.summary.html }} />
            </article>
          ))}

          {!!selectedCompanies.filter(c => c?.summary?.html).map(c =>
            <article>
              <h3 className='text-3xl font-identity'>More info on {c.fields.Name}</h3>
              <div className='prose' dangerouslySetInnerHTML={{ __html: c.summary.html }} />
            </article>
          )}

          {!!selectedCountries.filter(c => c?.summary?.html).map(c =>
            <article>
              <h3 className='text-3xl font-identity'>More info on {c.fields.Name}</h3>
              <div className='prose' dangerouslySetInnerHTML={{ __html: c.summary.html }} />
            </article>
          )}

          <div className='pb-1' />

          <SolidarityActionsList
            data={filteredActions}
            withDialog
            dialogProps={{
              cardProps: {
                withContext: true
              },
            }}
          />

          <article>
            <p>Can you contribute more info about worker organising?</p>

            <div className='space-x-2'>
              <Link href='/submit'>
                <span className='button'>
                  Submit a solidarity action
                </span>
              </Link>
              <a className='button' href={`mailto:${projectStrings.email}`}>
                Contact us
              </a>
            </div>
          </article>
        </section>
      </div>
    </FilterContext.Provider>
  )
}