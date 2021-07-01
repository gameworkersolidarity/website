import { SolidarityActionsList } from '../components/SolidarityActions';
import { getSolidarityActions } from '../data/solidarityAction';
import { SolidarityAction, CountryEmoji, Company } from '../data/types';
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
import { Listbox } from '@headlessui/react'

type PageProps = {
  actions: SolidarityAction[],
  companies: Company[]
}
type PageParams = {
  countryCode?: string
}

export default function Page({ actions, companies }: PageProps) {
  const useURLState = useURLStateFactory()

  /**
   * Categories
   */
  const [filteredCategories, setCategories] = useURLState(
    'categories',
    (initial) => useState<string[]>(initial ? ensureArray(initial) as string[] : [])
  )
  const toggleCategory = (category: string) => {
    setCategories(categories => toggleInArray(categories, category))
  }
  // TODO: load categories from a relational table
  const categories = useMemo(() => {
    return Array.from(new Set(actions.reduce((arr, action) => [...arr, ...(action.fields?.Category || [] as string[])], [])))
  }, [actions])

  /**
   * Companies
   */
  const [filteredCompanyIds, setCompanies] = useURLState(
    'companies',
    (initial) => useState<string[]>(initial ? ensureArray(initial) as string[] : [])
  )
  const selectedCompanies = filteredCompanyIds.map(id => companies.find(c => c.id === id))
  const toggleCompany = (id: string) => {
    setCompanies(companies => toggleInArray(companies, id))
  }

  /**
   * Countries
   */
  const [countryCodeFilter, setCountry] = useURLState(
    'countryCode',
    initial => useState<string | undefined>(initial?.toString().toUpperCase())
  )
  // TODO: load actual country data including description, unions, etc.
  const selectedCountryData = useMemo(() => {
    if (countryCodeFilter) {
      return countryFlagEmoji.get(countryCodeFilter) as CountryEmoji
    } else {
      return null
    }
  }, [countryCodeFilter])

  /**
   * Filter metadata
   */
  const hasFilters = countryCodeFilter || filteredCategories.length || selectedCompanies.length

  const clearAllFilters = () => {
    setCountry(undefined)
    setCategories([])
    setCompanies([])
  }

  /**
   * Filtering
   */
  const search = useMemo(() => new Fuse(actions, {
    keys: [
      'fields.Category',
      'fields.countryCode',
      'fields.Company'
    ],
    // threshold: 0.5,
    findAllMatches: true,
    shouldSort: false,
    useExtendedSearch: true
  }), [actions])

  const filteredActions = useMemo(() => {
    if (!hasFilters) return actions
    const expression: Fuse.Expression = { $and: [] }
    if (filteredCategories.length) {
      expression.$and!.push({ $or: filteredCategories.map(c => ({ 'fields.Category': `'${c}` })) })
    }
    if (filteredCompanyIds.length) {
      expression.$and!.push({ $or: filteredCompanyIds.map(id => ({ 'fields.Company': `'${id}` })) })
    }
    if (!!countryCodeFilter) {
      expression.$and!.push({ 'fields.countryCode': `'${countryCodeFilter}` })
    }
    return search.search(expression).map(s => s.item)
  }, [actions, search, hasFilters, filteredCategories, filteredCompanyIds, countryCodeFilter])

  /**
   * Render
   */
  return (
    <PageLayout fullWidth>
      <div className='grid md:grid-cols-2'>
        <section className='p-4 lg:p-5'>
          <div className='sticky top-4 lg:top-5 space-y-4 overflow-y-auto'>
            <section className='-mb-3'>
              <h3 className='text-xs text-left left-0 w-full font-mono uppercase mb-2'>
                Filter by category
              </h3>
              <div className='flex flex-wrap p-1'>
                {categories.map(category => (
                  <div
                    key={category}
                    className={cx(
                      filteredCategories.includes(category) ? 'bg-gwOrange' : 'bg-gray-100',
                      'cursor-pointer capitalize rounded-lg px-3 py-2 text-sm m-2 -mt-1 -ml-1'
                    )}
                    onClick={() => toggleCategory(category)}>
                    {category}
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className='text-xs text-left left-0 w-full font-mono uppercase mb-2'>
                Filter by company
              </h3>
              <div className='relative'>
                <Listbox value={filteredCompanyIds[0]} onChange={v => setCompanies([v])}>
                  <Listbox.Button>
                    <div className='rounded-lg border border-gray-200 p-4 text-sm'>
                      {selectedCompanies[0]?.fields.Name || "Filter by company"}
                    </div>
                  </Listbox.Button>
                  <Listbox.Options>
                    <div className='overflow-y-auto p-1 rounded-lg bg-gray-100 absolute top-100 z-50' style={{ maxHeight: '33vh', height: 400 }}>
                      {companies.map((company) => (
                        <Listbox.Option
                          key={company.id}
                          value={company.id}
                        >
                          <div className='px-3 py-1 hover:bg-white rounded-lg cursor-pointer flex justify-between'>
                            <span>{company.fields.Name}</span>
                            <span className='ml-2 bg-white rounded-full px-2 py-1 text-xs ml-auto'>
                              {pluralize('action', company.fields['Solidarity Actions']?.length || 0, true)}
                            </span>
                          </div>
                        </Listbox.Option>
                      ))}
                    </div>
                  </Listbox.Options>
                </Listbox>
              </div>
            </section>
            <section className='w-full' style={{ maxHeight: '40vh', height: 500 }}>
              <h3 className='text-xs text-left left-0 w-full font-mono uppercase mb-2'>
                Filter by country
              </h3>
              <Map data={filteredActions} onSelectCountry={NEW => setCountry(old => (NEW === null || old === NEW) ? undefined : NEW)} />
            </section>
            <section className='pt-1'>
              <h3 className='text-xs text-left w-full font-mono uppercase pt-4'>
                Filter by year
              </h3>
              <CumulativeMovementChart data={filteredActions} />
            </section>
          </div>
        </section>

        <section className='bg-gray-100 p-4 lg:p-5 space-y-4'>
          <h2 className='text-6xl font-identity'>
            {pluralize('action', filteredActions.length, true)}
          </h2>

          <div className='flex flex-wrap w-full justify-start p-1'>
            {selectedCountryData && (
              <div className='m-2 -ml-1 -mt-1 cursor-pointer hover:bg-gwPinkLight rounded-lg bg-white px-3 py-2 font-semibold inline-block' onClick={() => setCountry(undefined)}>
                <Emoji symbol={selectedCountryData.emoji} /> {selectedCountryData?.name}
              </div>
            )}
            {filteredCategories?.map(category =>
              <div key={category} className='m-2 -ml-1 -mt-1 capitalize cursor-pointer hover:bg-gwPinkLight rounded-lg bg-white px-3 py-2 font-semibold inline-block'
                onClick={() => toggleCategory(category)
              }>
                {category}
              </div>
            )}
            {selectedCompanies?.map(company => company ? (
              <div key={company?.id} className='m-2 -ml-1 -mt-1 capitalize cursor-pointer hover:bg-gwPinkLight rounded-lg bg-white px-3 py-2 font-semibold inline-block'
                onClick={() => toggleCompany(company.id)}
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
  PageParams
> = async (context) => {
  const actions = await getSolidarityActions()
  const companies = await getCompanies()
  return {
    props: {
      actions,
      companies
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}