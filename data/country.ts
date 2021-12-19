import { Country, SolidarityAction, CountryEmoji, Geography } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { countrySchema, solidarityActionSchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import { getLiveSolidarityActionsByCountryCode } from './solidarityAction';
import { parseMarkdown } from './markdown';
import { getOrganisingGroupsByCountryId } from './organisingGroup';
import coords from 'country-coords'
import countryFlagEmoji from 'country-flag-emoji';
const coordsByCountry = coords.byCountry()
import { toBBOX } from 'country-to-bbox'

export function countryDataForCode (countryCode: string): Geography['country'][0] {
  // Add country data
  const { country: iso3166, ...countryCoordData } = coordsByCountry.get(countryCode)
  const emoji = countryFlagEmoji.get(countryCode) as CountryEmoji
  const bbox = emoji.name === 'France' ? [-5.4534286, 41.2632185, 9.8678344, 51.268318] : toBBOX(emoji.name === 'South Korea' ? 'S. Korea' : emoji.name)
  return {
    name: emoji.name,
    emoji,
    iso3166,
    bbox,
    ...countryCoordData
  }
}

export const formatCountry = (country: Country) => {
  country.emoji = countryFlagEmoji.get(country.fields.countryCode) as CountryEmoji
  country.fields.Name.trim()

  country.summary = parseMarkdown(country.fields.Summary || '')

  try {
    // Remove any keys not expected by the parser
    country = countrySchema.parse(country)
  } catch(e) {
    console.error(JSON.stringify(country), e)
  }
  return country
}

const fields: Array<keyof Country['fields']> = ['Name', 'countryCode', 'Summary', 'Slug', 'Solidarity Actions']

export const countryBase = () => airtableBase()<Country['fields']>(
  env.get('AIRTABLE_TABLE_NAME_COUNTRIES').default('Countries').asString()
)

export async function getCountries (selectArgs: QueryParams<Country['fields']> = {}): Promise<Array<Country>> {
  return new Promise((resolve, reject) => {
    const countries: Country[] = []

    function finish () {
      try {
        resolve(
          countries.filter(a =>
            countrySchema.safeParse(a).success === true
          )
        )
      } catch (e) {
        reject(e)
      }
    }

    countryBase().select({
      sort: [
        { field: "Name", direction: "asc", },
      ],
      fields: fields,
      maxRecords: 249,
      view: env.get('AIRTABLE_TABLE_VIEW_COUNTRIES').default('Grid view').asString(),
      filterByFormula: 'COUNTA({Solidarity Actions}) > 0',
      ...selectArgs
    }).eachPage(function page(records, fetchNextPage) {
      try {
        records.forEach(function(record) {
          countries.push(formatCountry(record._rawJson))
        });
        fetchNextPage();
      } catch(e) {
        finish()
      }
    }, function done(err) {
      if (err) { reject(err); return; }
      finish()
    });
  })
}

export async function getCountryBy (selectArgs: QueryParams<Country['fields']> = {}, description?: string) {
  let country: Country
  return new Promise<Country>((resolve, reject) => {
    countryBase().select({
      // sort: [
      //   { field: "Name", direction: "asc", },
      // ],
      fields: fields,
      maxRecords: 1,
      // view: env.get('AIRTABLE_TABLE_VIEW_COUNTRIES').default('Grid view').asString(),
      ...selectArgs
    }).firstPage(function page(error, records) {
      try {
        if (error) console.error(error)
        if (error || !records?.length) {
          return reject(`No countries was found for filter ${JSON.stringify(selectArgs)}`)
        }
        const country = records?.[0]._rawJson
        resolve(formatCountry(country))
      } catch(e) {
        reject(e)
      }
    })
  })
}

export async function getCountryByCode (countryCode: string) {
  return getCountryBy({
    filterByFormula: `{countryCode}="${countryCode.toUpperCase()}"`
  })
}

export async function getCountryBySlug (slug: string) {
  return getCountryBy({
    filterByFormula: `{Slug}="${slug.toLowerCase()}"`
  })
}


export type CountryData = {
  country: Country
}

export const getCountryDataByCode = async (iso2: string): Promise<CountryData> => {
  if (!iso2 || !/[A-Za-z]{2}/.test(iso2)) {
    throw new Error("A two-digit ISO3166a2 country code must be provided.")
  }
  const country = await getCountryByCode(iso2)
  if (!country) {
    throw new Error("No such country was found for this country code.")
  }

  const solidarityActions = await getLiveSolidarityActionsByCountryCode(iso2)
  const organisingGroups = await getOrganisingGroupsByCountryId(country.id)

  return {
    country: {
      ...country,
      organisingGroups,
      solidarityActions
    }
  }
}

export const getCountryDataBySlug = async (slug: string): Promise<CountryData> => {
  if (!/[A-Za-z-]+/.test(slug)) {
    throw new Error(`'${slug}' isn't a valid country name`)
  }
  let country
  try {
    country = await getCountryBySlug(slug)
    if (!country) {
      throw new Error(`No country was found called '${slug}'`)
    }
  } catch (e) {
    console.error(e)
    throw new Error(`No country was found called '${slug}'`)
  }

  const solidarityActions = await getLiveSolidarityActionsByCountryCode(country.fields.countryCode)

  return {
    country: {
      ...country,
      solidarityActions
    }
  }
}