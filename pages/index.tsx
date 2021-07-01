import { SolidarityActionsList } from '../components/SolidarityActions';
import { getSolidarityActions } from '../data/solidarityAction';
import { SolidarityAction, CountryEmoji, Company, Category, Country, OrganisingGroup } from '../data/types';
import Link from 'next/link';
import { projectStrings } from '../data/site';
import { Map } from '../components/Map';
import env from 'env-var';
import { GetStaticProps } from 'next';
import PageLayout from '../components/PageLayout';
import { CumulativeMovementChart } from '../components/ActionChart';
import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import countryFlagEmoji from 'country-flag-emoji';
import Emoji from 'a11y-react-emoji';
import pluralize from 'pluralize';
import cx from 'classnames';
import { useURLStateFactory } from '../utils/state';
import { ensureArray, toggleInArray } from '../utils/string';
import { getCompanies } from '../data/company';
import { Listbox, Disclosure } from '@headlessui/react'
import { getCategories } from '../data/category';
import { getCountries, CountryData } from '../data/country';
import { NextRouter, useRouter } from 'next/dist/client/router';
import useSWR from 'swr';
import { useContextualRouting } from 'next-use-contextual-routing';
import { OrganisingGroupDialog, useSelectedOrganisingGroup } from '../components/OrganisingGroup';
import { UnionsByCountryData } from './api/organisingGroupsByCountry';
import { ChevronRightIcon } from '@heroicons/react/outline';
import { scrollToId } from '../utils/router';

type PageProps = {
  actions: SolidarityAction[],
  companies: Company[],
  categories: Category[],
  countries: Country[]
}

export default function Page({ actions, companies, categories, countries }: PageProps) {
  const router = useRouter()
  const useURLState = useURLStateFactory()

  /**
   * Categories
   */
  const [filteredCategoryNames, setCategories] = useURLState(
    'categories',
    (initial) => useState<string[]>(initial ? ensureArray(initial) as string[] : [])
  )
  const toggleCategory = (category: string) => {
    setCategories(categories => toggleInArray(categories, category))
  }
  const selectedCategories = useMemo(() =>
    filteredCategoryNames.map(name => categories.find(c => c.fields.Name === name)),
  [filteredCategoryNames])

  /**
   * Companies
   */
  const [filteredCompanyNames, setCompanies] = useURLState(
    'companies',
    (initial) => useState<string[]>(initial ? ensureArray(initial) as string[] : [])
  )
  const toggleCompany = (id: string) => {
    setCompanies(companies => toggleInArray(companies, id))
  }
  const selectedCompanies = useMemo(() =>
    filteredCompanyNames.map(name => companies.find(c => c.fields.Name === name)),
  [filteredCompanyNames])

  /**
   * Countries
   */
  const [filteredCountrySlugs, setCountries] = useURLState(
    'countries',
    (initial) => useState<string[]>(initial ? ensureArray(initial) as string[] : [])
  )
  const toggleCountry = (id: string) => {
    setCountries(countries => toggleInArray(countries, id))
  }
  const selectedCountries = useMemo(() =>
    filteredCountrySlugs.map(slug => countries.find(c => c.fields.Slug === slug)),
  [filteredCountrySlugs])

  /**
   * Filter metadata
   */
  const hasFilters = selectedCountries.length || selectedCompanies.length || selectedCategories.length

  const clearAllFilters = () => {
    setCountries([])
    setCategories([])
    setCompanies([])
  }

  /**
   * Filtering
   */
  const search = useMemo(() => new Fuse(actions, {
    keys: [
      'fields.Category',
      'fields.Company',
      'fields.Country',
    ],
    // threshold: 0.5,
    findAllMatches: true,
    shouldSort: false,
    useExtendedSearch: true
  }), [actions])

  const filteredActions = useMemo(() => {
    if (!hasFilters) return actions
    const expression: Fuse.Expression = { $and: [] }
    if (selectedCategories.length) {
      expression.$and!.push({ $or: selectedCategories.map(c => ({ 'fields.Category': `'${c?.id}` })) })
    }
    if (selectedCompanies.length) {
      expression.$and!.push({ $or: selectedCompanies.map(c => ({ 'fields.Company': `'${c?.id}` })) })
    }
    if (selectedCountries.length) {
      expression.$and!.push({ $or: selectedCountries.map(c => ({ 'fields.Country': `'${c?.id}` })) })
    }
    return search.search(expression).map(s => s.item)
  }, [actions, search, hasFilters, selectedCategories, selectedCompanies, selectedCountries])

  //

  const unions = useSWR<UnionsByCountryData>(
    selectedCountries.length ? `/api/organisingGroupsByCountry?iso2=${selectedCountries[0]?.emoji.code}` : null,
    {
      initialData: { unionsByCountry: [], iso2: '' },
      revalidateOnMount: true
    }
  )
  const UNION_DISPLAY_LIMIT = 5
  const { makeContextualHref, returnHref } = useContextualRouting();
  const [selectedUnion, unionDialogKey] = useSelectedOrganisingGroup(unions.data?.unionsByCountry || [])

  /**
   * Render
   */
  return (
    <PageLayout fullWidth>
      <OrganisingGroupDialog data={selectedUnion} onClose={() => { router.push(returnHref, undefined, { shallow: true }) }} />
      <div className='grid md:grid-cols-2'>
        <section className='p-4 lg:p-5'>
          <div className='sticky top-4 lg:top-5 space-y-4 overflow-y-auto'>
            <section>
              <h3 className='text-xs text-left left-0 w-full font-mono uppercase mb-2'>
                Filter by
              </h3>
              <div className='relative space-x-2 flex'>
                <div>
                  <Listbox value={filteredCountrySlugs[0]} onChange={v => setCountries([v])}>
                    <Listbox.Button>
                      <div className='rounded-lg border border-gray-200 px-3 py-2 text-sm'>
                        {"Country"}
                      </div>
                    </Listbox.Button>
                    <Listbox.Options>
                      <div className='overflow-y-auto p-1 rounded-lg bg-white absolute top-100 z-50' style={{ maxHeight: '33vh', height: 400 }}>
                        {countries.map((country) => (
                          <Listbox.Option
                            key={country.id}
                            value={country.fields.Slug}
                          >
                            <div className='px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-left flex justify-start w-full'>
                              <span><Emoji symbol={country.emoji.emoji} /></span>
                              <span className='text-sm ml-1 inline-block'>{country.fields.Name}</span>
                              <span className='inline-block align-baseline text-xs ml-auto text-gray-500 pl-2'>
                                {pluralize('action', country.fields['Solidarity Actions']?.length || 0, true)}
                              </span>
                            </div>
                          </Listbox.Option>
                        ))}
                      </div>
                    </Listbox.Options>
                  </Listbox>
                </div>
                <div>
                  <Listbox value={filteredCategoryNames[0]} onChange={v => setCategories([v])}>
                    <Listbox.Button>
                      <div className='rounded-lg border border-gray-200 px-3 py-2 text-sm'>
                        {"Category"}
                      </div>
                    </Listbox.Button>
                    <Listbox.Options>
                      <div className='overflow-y-auto p-1 rounded-lg bg-white absolute top-100 z-50' style={{ maxHeight: '33vh', height: 400 }}>
                        {categories.map((category) => (
                          <Listbox.Option
                            key={category.id}
                            value={category.fields.Name}
                          >
                            <div className='px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-left flex justify-start w-full'>
                              <span className='text-sm inline-block align-baseline'>{category.fields.Emoji}</span>
                              <span className='text-sm inline-block align-baseline capitalize ml-1'>{category.fields.Name}</span>
                              <span className='align-baseline inline-block text-xs ml-auto text-gray-500 pl-2'>
                                {pluralize('action', category.fields['Solidarity Actions']?.length || 0, true)}
                              </span>
                            </div>
                          </Listbox.Option>
                        ))}
                      </div>
                    </Listbox.Options>
                  </Listbox>
                </div>
                <div>
                  <Listbox value={filteredCompanyNames[0]} onChange={v => setCompanies([v])}>
                    <Listbox.Button>
                      <div className='rounded-lg border border-gray-200 px-3 py-2 text-sm'>
                        {"Company"}
                      </div>
                    </Listbox.Button>
                    <Listbox.Options>
                      <div className='overflow-y-auto p-1 rounded-lg bg-white absolute top-100 z-50' style={{ maxHeight: '33vh', height: 400 }}>
                        {companies.map((company) => (
                          <Listbox.Option
                            key={company.id}
                            value={company.fields.Name}
                          >
                            <div className='px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-left flex justify-start w-full'>
                              <span className='text-sm inline-block align-baseline'>{company.fields.Name}</span>
                              <span className='align-baseline inline-block text-xs ml-auto text-gray-500 pl-2'>
                                {pluralize('action', company.fields['Solidarity Actions']?.length || 0, true)}
                              </span>
                            </div>
                          </Listbox.Option>
                        ))}
                      </div>
                    </Listbox.Options>
                  </Listbox>
                </div>
              </div>
            </section>
            <section className='w-full' style={{ maxHeight: '40vh', height: 500 }}>
              <h3 className='text-xs text-left left-0 w-full font-mono uppercase mb-2'>
                Filter by country
              </h3>
              <Map data={filteredActions} onSelectCountry={iso2 => {
                const countrySlug = countries.find(c => c.fields.countryCode === iso2)?.fields.Slug
                if (countrySlug) {
                  setCountries([countrySlug])
                }
              }} />
            </section>
            <section className='pt-1'>
              <h3 className='text-xs text-left w-full font-mono uppercase pt-4'>
                Filter by year
              </h3>
              <CumulativeMovementChart data={filteredActions} onSelectYear={year => scrollToId(router, year)} />
            </section>
          </div>
        </section>

        <section className='bg-gray-100 p-4 lg:p-5 space-y-4'>
          <h2 className='text-6xl font-identity'>
            {pluralize('action', filteredActions.length, true)}
          </h2>

          <div className='flex flex-wrap w-full justify-start p-1'>
            {selectedCountries?.map(country => country ? (
              <div key={country.id} className='m-2 -ml-1 -mt-1 cursor-pointer hover:bg-gwPinkLight rounded-lg bg-white px-3 py-2 font-semibold inline-block'
                onClick={() => toggleCountry(country.fields.Slug)}
              >
                <Emoji symbol={country.emoji.emoji} /> {country?.emoji.name}
              </div>
            ) : null)}
            {selectedCategories?.map(category => category ? (
              <div key={category?.id} className='m-2 -ml-1 -mt-1 capitalize cursor-pointer hover:bg-gwPinkLight rounded-lg bg-white px-3 py-2 font-semibold inline-block'
                onClick={() => toggleCategory(category.fields.Name)}
              >
                <span className='inline-block'>{category.fields.Emoji}</span>
                <span className='inline-block capitalize ml-1'>{category.fields.Name}</span>
              </div>
            ) : null)}
            {selectedCompanies?.map(company => company ? (
              <div key={company?.id} className='m-2 -ml-1 -mt-1 capitalize cursor-pointer hover:bg-gwPinkLight rounded-lg bg-white px-3 py-2 font-semibold inline-block'
                onClick={() => toggleCompany(company.fields.Name)}
              >
                {company?.fields.Name}
              </div>
            ) : null)}
            {hasFilters ? (
              <div className='m-2 -ml-1 -mt-1 cursor-pointer hover:bg-gwPinkLight rounded-lg border-black border px-3 py-2 font-semibold inline-block'
                onClick={clearAllFilters}
              >
                Clear all filters <div className='inline-block transform rotate-45'>+</div>
              </div>
            ) : null}
          </div>

          {!!selectedCategories[0]?.summary?.html && (
            <article>
              <h3 className='text-3xl font-identity'>More info on {selectedCategories[0].fields.Name}</h3>
              <div className='prose' dangerouslySetInnerHTML={{ __html: selectedCategories[0]?.summary.html }} />
            </article>
          )}

          {!!selectedCompanies[0]?.summary?.html && (
            <article>
              <h3 className='text-3xl font-identity'>More info on {selectedCompanies[0].fields.Name}</h3>
              <div className='prose' dangerouslySetInnerHTML={{ __html: selectedCompanies[0]?.summary.html }} />
            </article>
          )}

          {!!selectedCountries[0]?.summary?.html && (
            <article>
              <h3 className='text-3xl font-identity'>More info on {selectedCountries[0].fields.Name}</h3>
              <div className='prose' dangerouslySetInnerHTML={{ __html: selectedCountries[0]?.summary.html }} />
            </article>
          )}

          {!!selectedCountries[0]?.fields.Name && !!unions?.data?.unionsByCountry?.length && (
            <article>
              <h3 className='text-3xl font-light'>Active organising groups in {selectedCountries[0].fields.Name}</h3>
              <ul className='list space-y-1 my-3'>
                <Disclosure>
                  {({ open }) => (
                    <>
                      {unions?.data?.unionsByCountry?.slice(0, open ? 1000 : UNION_DISPLAY_LIMIT).map(union =>
                        <Link href={makeContextualHref({ [unionDialogKey]: union.id })} key={union.id}>
                          <li className='space-x-1'>
                            <Emoji
                              symbol={categories.find(c => c.fields.Name === 'union')?.fields.Emoji || '🤝'}
                              label={union.fields.IsUnion ? 'Union' : 'Organising Group'}
                            />
                            <span className='link'>{union.fields.Name}</span>
                            {union.fields.IsUnion && <span className='inline-block ml-2 text-gray-400 rounded-full text-xs ml-auto'>
                              ({union.fields.IsUnion ? 'Union' : 'Organising Group'})
                            </span>}
                          </li>
                        </Link>
                      )}
                      {(unions?.data?.unionsByCountry?.length || 0) > UNION_DISPLAY_LIMIT && (
                        <Disclosure.Button>
                          <div className='text-sm link px-2 my-2'>
                            <span>{open
                              ? "Show fewer organising groups"
                              : `Show all ${unions?.data?.unionsByCountry?.length} organising groups`
                            }</span>
                            <ChevronRightIcon
                              className={`${open ? "rotate-270" : "rotate-90"} transform w-3 inline-block`}
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

          <div className='pb-1' />

          <SolidarityActionsList
            data={filteredActions}
            withDialog
            dialogProps={{
              cardProps: {
                withContext: true,
                contextProps: {
                  listProps: {
                    withDialog: false
                  }
                }
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
    </PageLayout>
  )
}

export const getStaticProps: GetStaticProps<
  PageProps,
  {}
> = async (context) => {
  const actions = await getSolidarityActions()
  const companies = await getCompanies()
  const categories = await getCategories()
  const countries = await getCountries()
  return {
    props: {
      actions,
      companies,
      categories,
      countries
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}