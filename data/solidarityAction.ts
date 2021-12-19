import { SolidarityAction, SolidarityActionAirtableRecord } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { solidarityActionSchema, openStreetMapReverseGeocodeResponseSchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import coords from 'country-coords'
import { airtableFilterAND } from '../utils/airtable';
import { parseMarkdown } from './markdown';
import { geocodeOpenStreetMap } from './geo';
import { countryDataForCode } from './country';

export const formatSolidarityAction = async (record: SolidarityActionAirtableRecord): Promise<SolidarityAction> => {
  let action = JSON.parse(JSON.stringify(record))
  action.summary = parseMarkdown(action.fields.Summary || '')
  action.geography = { country: [] }
  action.slug = action.fields.slug || action.id

  let i = 0
  for (const countryCode of action.fields.countryCode || []) {
    try {
      action.geography.country.push(countryDataForCode(countryCode))
    } catch (e) {
      console.error(JSON.stringify(action), e)
    }
    i++;

    // Add city
    if (action.fields.LocationData) {
      action.geography.location = JSON.parse(action.fields.LocationData)
    } else if (action.fields.Location) {

      console.log("Fetching location data from OpenStreetMap")
      const _data = await geocodeOpenStreetMap(action.fields.Location!, countryCode)
      // @ts-ignore
      const { data, error } = openStreetMapReverseGeocodeResponseSchema.safeParse(_data)
      if (error) {
        console.error(_data, error)
      } else if (data) {
        action.geography.location = data
        solidarityActionBase().update(action.id, {
          LocationData: JSON.stringify(data)
        })
      }
    }
  }

  action = solidarityActionSchema.parse(action)
  return action
}

export function actionToFeature(action: SolidarityAction): GeoJSON.Feature<GeoJSON.Point, SolidarityAction> {
  // 
  return {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [
        action.geography.country[0].longitude,
        action.geography.country[0].latitude
      ]
    },
    "properties": action
  }
}

const fields: Array<keyof SolidarityActionAirtableRecord['fields']> = ['hasPassedValidation', 'slug', 'companyName', 'organisingGroupName', 'Organising Groups', 'Company', 'Country', 'LocationData', 'Document', 'countryCode', 'countryName', 'countrySlug', 'LastModified', 'DisplayStyle', 'Name', 'Location', 'Summary', 'Date', 'Link', 'Public', 'Category', 'CategoryName', 'CategoryEmoji']

// @ts-ignore
export const solidarityActionBase = () => airtableBase()<SolidarityActionAirtableRecord['fields']>(
  env.get('AIRTABLE_TABLE_NAME_SOLIDARITY_ACTIONS').default('Solidarity Actions').asString()
)

// 
export async function getAllSolidarityActions ({ filterByFormula = '', ...selectArgs }: QueryParams<SolidarityActionAirtableRecord['fields']> = {}): Promise<Array<SolidarityActionAirtableRecord>> {
  return new Promise((resolve, reject) => {
    const solidarityActions: SolidarityActionAirtableRecord[] = []

    solidarityActionBase().select({
      filterByFormula,
      maxRecords: 1000000,
      ...selectArgs
    }).eachPage(function page(records, fetchNextPage) {
      try {
        for (const record of records) {
          solidarityActions.push(record._rawJson)
        }
        fetchNextPage();
      } catch (e) {
        console.error(e)
        reject(e)
      }
    }, function done(err) {
      try {
        if (err) { reject(err); return; }
        resolve(solidarityActions)
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  })
}

export async function getLiveSolidarityActions ({ filterByFormula, ...selectArgs }: QueryParams<SolidarityActionAirtableRecord['fields']> = {}): Promise<Array<SolidarityAction>> {
  const airtableRecords = await getAllSolidarityActions({
    filterByFormula: airtableFilterAND(
      'Public',
      'Name!=""',
      'Date!=""',
      filterByFormula
    ),
    fields: fields,
    sort: [
      { field: "Date", direction: "desc", },
    ],
    view: env.get('AIRTABLE_TABLE_VIEW_SOLIDARITY_ACTIONS').default('Live').asString(),
    ...selectArgs
  })
  const outputtedActions: SolidarityAction[] = []
  for (const record of airtableRecords) {
    try {
      outputtedActions.push(await formatSolidarityAction(record))
    } catch(e) {
      console.error(e)
    }
  }
  return outputtedActions
}

export async function getLiveSolidarityActionsByCountryCode (iso2: string) {
  const filterByFormula = `FIND("${iso2}", ARRAYJOIN({countryCode})) > 0`
  return getLiveSolidarityActions({ filterByFormula })
}

export async function getLiveSolidarityActionsByCompanyId (id: string) {
  const filterByFormula = `FIND("${id}", ARRAYJOIN({Company})) > 0`
  return getLiveSolidarityActions({ filterByFormula })
}

export async function getLiveSolidarityActionsByCategoryId (id: string) {
  const filterByFormula = `FIND("${id}", ARRAYJOIN({Category})) > 0`
  return getLiveSolidarityActions({ filterByFormula })
}

export async function getLiveSolidarityActionsByOrganisingGroupId (id: string) {
  const filterByFormula = `FIND("${id}", ARRAYJOIN({Organising Groups})) > 0`
  return getLiveSolidarityActions({ filterByFormula })
}

export async function getSingleSolidarityAction (id: string) {
  const filterByFormula = `OR({slug}="${id}", RECORD_ID()="${id}")`
  const actions = await getLiveSolidarityActions({ filterByFormula, maxRecords: 1 })
  return actions[0]
}

export function actionUrl(action: SolidarityAction): string {
  return `/action/${action.slug}`
}