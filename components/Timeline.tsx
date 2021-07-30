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
import { scrollToId } from '../utils/router';
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
    window.scroll({
      top: document.getElementById('static-header')?.offsetHeight || 100,
      behavior: 'smooth'
    })
  }, [filterText, selectedCategories, selectedCompanies, selectedOrganisingGroups, selectedCountries])

  //

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
      <div className='grid md:grid-cols-2'>
        <section className='p-4 lg:p-5 xl:pr-7 space-y-4'>
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