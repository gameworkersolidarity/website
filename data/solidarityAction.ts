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

export const formatSolidarityAction = (d: SolidarityAction) => {
  d.geography = { country: [], city: null }

  // Add country-level data
  let i = 0
  for (const countryCode of d.fields['Country Code']) {
    const { country: iso3166, ...countryCoordData } = coordsByCountry.get(countryCode)
    const emoji = countryFlagEmoji.get(countryCode)
    try {
      d.geography.country.push({
        name: d.fields['Country Name'][i],
        emoji,
        iso3166,
        ...countryCoordData
      })
    } catch (e) {
      console.error(e)
    }
    i++;
  }

  // Add city
  d.geography.city = d.fields.Location ? (cities as City[]).find(city => (
    city.name.includes(d.fields.Location) ||
    d.fields.Location.includes(city.name)
  )) || null : null

  try {
    solidarityActionSchema.parse(d)
  } catch(e) {
    console.error(e)
  }
  return d
}

const fields: Array<keyof SolidarityAction['fields']> = ['Document', 'Country', 'Country Code', 'Country Name', 'Country Code', 'Country Slug', 'LastModified', 'DisplayStyle', 'Name', 'Location', 'Summary', 'Date', 'Link', 'Public', 'Category']

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
      // fields: fields,
      maxRecords: 1000,
      view: env.get('AIRTABLE_TABLE_VIEW_SOLIDARITY_ACTIONS').default('Main view').asString(),
      ...selectArgs
    }).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        solidarityActions.push(formatSolidarityAction(record._rawJson))
      });
      fetchNextPage();
    }, function done(err) {
      if (err) { reject(err); return; }
      resolve(
        solidarityActions.filter(a =>
          solidarityActionSchema.safeParse(a).success === true
        )
      )
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
      if (error) {
        return reject(error)
      }
      return resolve(formatSolidarityAction(record._rawJson))
    })
  })
}