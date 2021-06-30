import { SolidarityActionsFullList, SolidarityActionsList } from '../components/SolidarityActions';
import { getSolidarityActions } from '../data/solidarityAction';
import { SolidarityAction, CountryEmoji } from '../data/types';
import { format } from 'date-fns';
import { SolidarityActionsData } from './api/solidarityActions';
import Link from 'next/link';
import { projectStrings } from '../data/site';
import { Map } from '../components/Map';
import env from 'env-var';
import { GetStaticProps } from 'next';
import PageLayout from '../components/PageLayout';
import { CumulativeMovementChart } from '../components/ActionChart';
import { useMemo, useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import countryFlagEmoji from 'country-flag-emoji';
import Emoji from 'a11y-react-emoji';
import pluralize from 'pluralize';
import cx from 'classnames';
import qs from 'query-string';
import { useRouter } from 'next/dist/client/router';
import { useURLStateFactory } from '../utils/state';
import { ensureArray } from '../utils/string';

type PageData = {
  solidarityActions: SolidarityAction[],
}
type PageParams = {
  countryCode?: string
}

export default function Page({ solidarityActions: actions }: PageData) {
  const search = useMemo(() => new Fuse(actions, {
    keys: [
      'fields.Category',
      'fields.countryCode'
    ],
    // threshold: 0.5,
    findAllMatches: true,
    shouldSort: false,
    useExtendedSearch: true
  }), [actions])

  const categories = useMemo(() => {
    return Array.from(new Set(actions.reduce((arr, action) => [...arr, ...(action.fields?.Category || [] as string[])], [])))
  }, [actions])

  const useURLState = useURLStateFactory()

  const [filteredCategories, setCategories] = useURLState(
    'categories',
    (initial) => useState<string[]>(initial ? ensureArray(initial) as string[] : [])
  )

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

  const toggleCategory = (category: string) => {
    let categories = JSON.parse(JSON.stringify(filteredCategories))
    const i = categories.indexOf(category)
    let _categories
    if (i > -1) {
      categories.splice(i, 1)
      _categories = categories
    } else {
      _categories = Array.from(new Set(categories.concat([category])))
    }
    setCategories(_categories)
  }

  const filteredActions = useMemo(() => {
    const expression: Fuse.Expression = { $and: [] }
    if (filteredCategories.length) {
      expression.$and!.push({ $or: filteredCategories.map(c => ({ 'fields.Category': `'${c}` })) })
    }
    if (!!countryCodeFilter) {
      expression.$and!.push({ 'fields.countryCode': `'${countryCodeFilter}` })
    }
    if (expression.$and!.length) {
      return search.search(expression).map(s => s.item)
    } else {
      return actions
    }
  }, [actions, search, filteredCategories, countryCodeFilter])

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
              <div key={category} className='m-2 -ml-1 -mt-1 capitalize cursor-pointer hover:bg-gwPinkLight rounded-lg bg-white px-3 py-2 font-semibold inline-block' onClick={() => toggleCategory(category)}>
                {category}
              </div>
            )}

            {(selectedCountryData || filteredCategories.length) ? (
              <div className='m-2 -ml-1 -mt-1 cursor-pointer hover:bg-gwPinkLight rounded-lg border-black border px-3 py-2 font-semibold inline-block ml-auto' onClick={() => {
                setCountry(undefined)
                setCategories([])
              }}>
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
  SolidarityActionsData,
  PageParams
> = async (context) => {
  const data = await getSolidarityActions()
  return {
    props: {
      solidarityActions: data,
    } as SolidarityActionsData,
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}