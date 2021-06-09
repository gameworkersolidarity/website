import { SolidarityAction } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { solidarityActionSchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import coords from 'country-coords'
import { countryToAlpha2 } from "country-to-iso"
const coordsByCountry = coords.byCountry()

export const formatSolidarityAction = (d: SolidarityAction) => {
  try {
    d._coordinates = coordsByCountry.get(countryToAlpha2(d.fields.Country))
  } catch (e) {
    console.error(e)
  }
  return d
}

const validFilter = 'AND(Public, Name!="", Date!="", Country!="")'
const fields: Array<keyof SolidarityAction['fields']> = ['DisplayStyle', 'Name', 'Location', 'Summary', 'Date', 'Link', 'Country', 'Public', 'Category']

export const solidarityActionBase = () => airtableBase<SolidarityAction['fields']>(
  env.get('AIRTABLE_TABLE_NAME_SOLIDARITY_ACTIONS').required().asString()
)

export async function getSolidarityActions (selectArgs: QueryParams<SolidarityAction['fields']> = {}): Promise<Array<SolidarityAction>> {
  return new Promise((resolve, reject) => {
    const solidarityActions: SolidarityAction[] = []

    solidarityActionBase().select({
      filterByFormula: validFilter,
      sort: [
        { field: "Date", direction: "asc", },
        { field: "Country", direction: "asc", }
      ],
      fields: fields,
      maxRecords: 1000,
      view: env.get('AIRTABLE_TABLE_VIEW_SOLIDARITY_ACTIONS').required().asString(),
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
    });
  })
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