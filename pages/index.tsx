import { SolidarityActionsList } from '../components/SolidarityActions';
import { getSolidarityActions } from '../data/solidarityAction';
import { SolidarityAction, CountryEmoji, Company, Category } from '../data/types';
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
import { getCategories } from '../data/category';

type PageProps = {
  actions: SolidarityAction[],
  companies: Company[],
  categories: Category[]
}
type PageParams = {
  countryCode?: string
}

export default function Page({ actions, companies, categories }: PageProps) {
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
  const hasFilters = countryCodeFilter || filteredCategoryNames.length || selectedCompanies.length

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
    if (filteredCategoryNames.length) {
      expression.$and!.push({ $or: filteredCategoryNames.map(c => ({ 'fields.Category': `'${c}` })) })
    }
    if (selectedCompanies.length) {
      expression.$and!.push({ $or: selectedCompanies.map(c => ({ 'fields.Company': `'${c?.id}` })) })
    }
    if (!!countryCodeFilter) {
      expression.$and!.push({ 'fields.countryCode': `'${countryCodeFilter}` })
    }
    return search.search(expression).map(s => s.item)
  }, [actions, search, hasFilters, filteredCategoryNames, selectedCompanies, countryCodeFilter])

  /**
   * Render
   */
  return (
    <PageLayout fullWidth>
      <div className='grid md:grid-cols-2'>
        <section className='p-4 lg:p-5'>
          <div className='sticky top-4 lg:top-5 space-y-4 overflow-y-auto'>
            <section>
              <h3 className='text-xs text-left left-0 w-full font-mono uppercase mb-2'>
                Filter by
              </h3>
              <div className='relative space-x-2 flex'>
                <div>
                  <Listbox value={filteredCategoryNames[0]} onChange={v => setCategories([v])}>
                    <Listbox.Button>
                      <div className='rounded-lg border border-gray-200 px-3 py-2 text-sm'>
                        {selectedCategories[0]?.fields.Name || "Category"}
                      </div>
                    </Listbox.Button>
                    <Listbox.Options>
                      <div className='overflow-y-auto p-1 rounded-lg bg-gray-100 absolute top-100 z-50' style={{ maxHeight: '33vh', height: 400 }}>
                        {categories.map((category) => (
                          <Listbox.Option
                            key={category.id}
                            value={category.fields.Name}
                          >
                            <div className='px-3 py-1 hover:bg-white rounded-lg cursor-pointer flex justify-between'>
                              <span className='inline-block'>{category.fields.Name}</span>
                              <span className='inline-block ml-2 bg-white rounded-full px-2 py-1 text-xs ml-auto'>
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
                        {selectedCompanies[0]?.fields.Name || "Company"}
                      </div>
                    </Listbox.Button>
                    <Listbox.Options>
                      <div className='overflow-y-auto p-1 rounded-lg bg-gray-100 absolute top-100 z-50' style={{ maxHeight: '33vh', height: 400 }}>
                        {companies.map((company) => (
                          <Listbox.Option
                            key={company.id}
                            value={company.fields.Name}
                          >
                            <div className='px-3 py-1 hover:bg-white rounded-lg cursor-pointer flex justify-between'>
                              <span className='inline-block'>{company.fields.Name}</span>
                              <span className='inline-block ml-2 bg-white rounded-full px-2 py-1 text-xs ml-auto'>
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
            {selectedCategories?.map(category => category ? (
              <div key={category?.id} className='m-2 -ml-1 -mt-1 capitalize cursor-pointer hover:bg-gwPinkLight rounded-lg bg-white px-3 py-2 font-semibold inline-block'
                onClick={() => toggleCategory(category.fields.Name)}
              >
                {category?.fields.Name}
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
  const categories = await getCategories()
  return {
    props: {
      actions,
      companies,
      categories
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}