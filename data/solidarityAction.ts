import { SolidarityAction } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { solidarityActionSchema, openStreetMapReverseGeocodeResponseSchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import coords from 'country-coords'
import { airtableFilterAND } from '../utils/airtable';
import { parseMarkdown } from './markdown';
import { geocodeOpenStreetMap } from './geo';
import { countryDataForCode } from './country';

export const formatSolidarityAction = async (action: SolidarityAction) => {
  action.summary = parseMarkdown(action.fields.Summary || '')
  action.geography = { country: [] }
  action.slug = action.fields.slug || action.id

  let i = 0
  for (const countryCode of action.fields.countryCode) {
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

  try {
    // Remove any keys not expected by the parser
    action = solidarityActionSchema.parse(action)
  } catch(e) {
    console.error(JSON.stringify(action), e)
  }
  return action
}

const fields: Array<keyof SolidarityAction['fields']> = ['slug', 'companyName', 'organisingGroupName', 'Organising Groups', 'Company', 'Country', 'LocationData', 'Document', 'countryCode', 'countryName', 'countrySlug', 'LastModified', 'DisplayStyle', 'Name', 'Location', 'Summary', 'Date', 'Link', 'Public', 'Category', 'CategoryName', 'CategoryEmoji']

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
        { field: "Date", direction: "desc", },
        // { field: "Country", direction: "asc", }
      ],
      fields: fields,
      maxRecords: 1000,
      // view: env.get('AIRTABLE_TABLE_VIEW_SOLIDARITY_ACTIONS').default('Main view').asString(),
      ...selectArgs
    }).eachPage(async function page(records, fetchNextPage) {
      try {
        for (const record of records) {
          solidarityActions.push(await formatSolidarityAction(record._rawJson))
        }
        fetchNextPage();
      } catch (e) {
        console.error(e)
        reject(e)
      }
    }, function done(err) {
      try {
        if (err) { reject(err); return; }
        resolve(
          solidarityActions
            .filter(a =>
              solidarityActionSchema.safeParse(a).success === true
            )
        )
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  })
}

export async function getSolidarityActionsByCountryCode (iso2: string) {
  const filterByFormula = `FIND("${iso2}", ARRAYJOIN({countryCode})) > 0`
  return getSolidarityActions({ filterByFormula })
}

export async function getSolidarityActionsByCompanyId (id: string) {
  const filterByFormula = `FIND("${id}", ARRAYJOIN({Company})) > 0`
  return getSolidarityActions({ filterByFormula })
}

export async function getSolidarityActionsByCategoryId (id: string) {
  const filterByFormula = `FIND("${id}", ARRAYJOIN({Category})) > 0`
  return getSolidarityActions({ filterByFormula })
}

export async function getSolidarityActionsByOrganisingGroupId (id: string) {
  const filterByFormula = `FIND("${id}", ARRAYJOIN({Organising Groups})) > 0`
  return getSolidarityActions({ filterByFormula })
}

export async function getSingleSolidarityAction (id: string) {
  const filterByFormula = `OR({slug}="${id}", RECORD_ID()="${id}")`
  const actions = await getSolidarityActions({ filterByFormula, maxRecords: 1 })
  return actions[0]
}