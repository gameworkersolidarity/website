import { Country, SolidarityAction } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { countrySchema, solidarityActionSchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import MarkdownIt from 'markdown-it'
import { getSolidarityActionsByCountryCode } from './solidarityAction';
const markdown = new MarkdownIt();
import countryFlagEmoji from "country-flag-emoji";

export const formatCountry = (country: Country) => {
  country.emoji = countryFlagEmoji.get(country.fields['Country Code'])
  country.fields.Name.trim()
  country.fields.Notes = markdown.render(country.fields.Notes || '')
  return country
}

const fields: Array<keyof Country['fields']> = ['Name', 'Country Code', 'Notes', 'Slug']

export const countryBase = () => airtableBase()<Country['fields']>(
  env.get('AIRTABLE_TABLE_NAME_COUNTRIES').default('Countries').asString()
)

export async function getCountries (selectArgs: QueryParams<Country['fields']> = {}): Promise<Array<Country>> {
  return new Promise((resolve, reject) => {
    const countrys: Country[] = []

    function finish () {
      resolve(
        // countrys.filter(a =>
        //   countrySchema.safeParse(a).success === true
        // )
        countrys
      )
    }

    countryBase().select({
      sort: [
        { field: "Name", direction: "asc", },
      ],
      fields: fields,
      maxRecords: 249,
      view: env.get('AIRTABLE_TABLE_VIEW_COUNTRIES').default('Grid view').asString(),
      ...selectArgs
    }).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        countrys.push(formatCountry(record._rawJson))
      });
      try {
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

export async function getCountryBy (selectArgs: QueryParams<Country['fields']> = {}) {
  let country: Country
  return new Promise<Country>((resolve, reject) => {
    countryBase().select({
      // sort: [
      //   { field: "Name", direction: "asc", },
      // ],
      // fields: fields,
      maxRecords: 1,
      // view: env.get('AIRTABLE_TABLE_VIEW_COUNTRIES').default('Grid view').asString(),
      ...selectArgs
    }).firstPage(function page(error, records) {
      country = records[0]._rawJson
      resolve(formatCountry(country))
    })
  })
}

export async function getCountryByCode (countryCode: string) {
  return getCountryBy({
    filterByFormula: `{Country Code}="${countryCode}"`
  })
}

export async function getCountryBySlug (slug: string) {
  return getCountryBy({
    filterByFormula: `{Slug}="${slug}"`
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
    throw new Error("No such country found for this country code.")
  }

  const solidarityActions = await getSolidarityActionsByCountryCode(iso2)

  return {
    country: {
      ...country,
      solidarityActions
    }
  }
}

export const getCountryDataBySlug = async (slug: string): Promise<CountryData> => {
  if (!/[A-Za-z-]+/.test(slug)) {
    throw new Error("A valid slug must be provided")
  }
  const country = await getCountryBySlug(slug)
  if (!country) {
    throw new Error("No such country found for this slug.")
  }

  const solidarityActions = await getSolidarityActionsByCountryCode(country.fields['Country Code'])

  return {
    country: {
      ...country,
      solidarityActions
    }
  }
}