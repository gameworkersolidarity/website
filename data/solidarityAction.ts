import { SolidarityAction, City, Country } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { solidarityActionSchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import coords from 'country-coords'
import { airtableFilterAND } from '../utils/airtable';
// import { countryToAlpha2 } from "country-to-iso"
import countryFlagEmoji from 'country-flag-emoji';
const coordsByCountry = coords.byCountry()
import cities from 'all-the-cities'
import { parseMarkdown } from './markdown';
import Fuse from 'fuse.js'
import { getCountries } from './country';
import { groupBy } from 'lodash'

const searchOptions: Fuse.IFuseOptions<City> = {
  isCaseSensitive: false,
  shouldSort: true,
  threshold: 0.485,
  keys: ['name']
}
const initialiseCitySearch = (cities: City[]) => {
  return new Fuse(cities, searchOptions)
}

const countryCityCache = groupBy(cities as City[], city => city.country)
const citySearchDict = Object.entries(countryCityCache).reduce((dict, [code, cities]) => {
  dict[code] = {
    search: initialiseCitySearch(cities),
    cities
  }
  return dict
}, {} as {
  [iso2: string]: {
    search: ReturnType<typeof initialiseCitySearch>,
    cities: City[]
  }
})

export const formatSolidarityAction = (action: SolidarityAction) => {
  action.summary = parseMarkdown(action.fields.Summary || '')
  action.geography = { country: [], city: [] }

  let i = 0
  for (const countryCode of action.fields['Country Code']) {
    // Add country data
    const { country: iso3166, ...countryCoordData } = coordsByCountry.get(countryCode)
    const emoji = countryFlagEmoji.get(countryCode)
    try {
      action.geography.country.push({
        name: action.fields['Country Name'][i],
        emoji,
        iso3166,
        ...countryCoordData
      })
    } catch (e) {
      console.error(JSON.stringify(action), e)
    }
    i++;

    // TODO: Add US states, because they are arrogantly large

    // Add city
    if (action.fields.Location) {
      const citySearch = citySearchDict[countryCode].search
      let city = citySearch.search(action.fields.Location!)?.[0]?.item
      if (city) {
        action.geography.city.push(city)
      } else {
        city = citySearch.search(action.fields.Location!.split(',')[0])?.[0]?.item
        if (city) {
          action.geography.city.push(city)
        }
      }
    }
  }

  try {
    // Remove any keys not expected by the parser
    action = solidarityActionSchema.parse(action)
  } catch(e) {
    console.error(JSON.stringify(action), e)
  }
  return action
}

const fields: Array<keyof SolidarityAction['fields']> = ['Document', 'Country Code', 'Country Name', 'Country Code', 'Country Slug', 'LastModified', 'DisplayStyle', 'Name', 'Location', 'Summary', 'Date', 'Link', 'Public', 'Category']

// @ts-ignore
export const solidarityActionBase = () => airtableBase()<SolidarityAction['fields']>(
  env.get('AIRTABLE_TABLE_NAME_SOLIDARITY_ACTIONS').default('Solidarity Actions').asString()
)

export async function getSolidarityActions ({ filterByFormula, ...selectArgs }: QueryParams<SolidarityAction['fields']> = {}): Promise<Array<SolidarityAction>> {
  return new Promise((resolve, reject) => {
    const solidarityActions: SolidarityAction[] = []

    filterByFormula = airtableFilterAND(
      'Public',
      'Name!=""',
      'Date!=""',
      filterByFormula
    )

    solidarityActionBase().select({
      filterByFormula,
      sort: [
        { field: "Date", direction: "asc", },
        // { field: "Country", direction: "asc", }
      ],
      fields: fields,
      maxRecords: 1000,
      view: env.get('AIRTABLE_TABLE_VIEW_SOLIDARITY_ACTIONS').default('Main view').asString(),
      ...selectArgs
    }).eachPage(function page(records, fetchNextPage) {
      try {
        records.forEach(function(record) {
          solidarityActions.push(formatSolidarityAction(record._rawJson))
        });
        fetchNextPage();
      } catch (e) {
        console.log(e)
      }
    }, function done(err) {
      try {
      if (err) { reject(err); return; }
      resolve(
        solidarityActions.filter(a =>
          solidarityActionSchema.safeParse(a).success === true
        )
      )
    } catch (e) {
      console.log(e)
    }
    })
  })
}

export async function getSolidarityActionsByCountryCode (iso2: string) {
  const filterByFormula = `FIND("${iso2}", ARRAYJOIN({Country Code})) > 0`
  return getSolidarityActions({ filterByFormula })
}

export async function getSingleSolidarityAction (recordId: string) {
  return new Promise<SolidarityAction>((resolve, reject) => {
    solidarityActionBase().find(recordId, (error, record) => {
      if (error || !record) {
        return reject(error || `No record found for ID ${recordId}`)
      }
      return resolve(formatSolidarityAction(record._rawJson))
    })
  })
}