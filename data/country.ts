import { Country, SolidarityAction } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { countrySchema, solidarityActionSchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import MarkdownIt from 'markdown-it'
const markdown = new MarkdownIt();

export const formatCountry = (country: Country) => {
  country.fields.Name.trim()
  country.fields.Notes = markdown.render(country.fields.Notes || '')
  return country
}

const fields: Array<keyof Country['fields']> = ['Name', 'Country Code', 'Notes', 'Slug']

export const countryBase = () => airtableBase<Country['fields']>(
  env.get('AIRTABLE_TABLE_NAME_COUNTRIES').default('Countries').asString()
)

export async function getCountries (selectArgs: QueryParams<Country['fields']> = {}): Promise<Array<Country>> {
  return new Promise((resolve, reject) => {
    const countrys: Country[] = []

    function finish () {
      resolve(
        countrys.filter(a =>
          countrySchema.safeParse(a).success === true
        )
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

export async function getCountry (countryCode: string) {
  let country: Country
  return new Promise<Country>((resolve, reject) => {
    countryBase().select({
      // sort: [
      //   { field: "Name", direction: "asc", },
      // ],
      // fields: fields,
      maxRecords: 1,
      // view: env.get('AIRTABLE_TABLE_VIEW_COUNTRIES').default('Grid view').asString(),
      filterByFormula: `{Country Code}="${countryCode}"`
    }).firstPage(function page(error, records) {
      country = records[0]._rawJson
      resolve(formatCountry(country))
    })
  })
}