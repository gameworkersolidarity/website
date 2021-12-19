import { OrganisingGroup } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { organisingGroupSchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import { getLiveSolidarityActionsByOrganisingGroupId } from './solidarityAction';
import { countryDataForCode } from './country';

export const formatOrganisingGroup = (organisingGroup: OrganisingGroup) => {
  organisingGroup.fields.Name.trim()
  organisingGroup.geography = { country: [] }
  organisingGroup.slug = organisingGroup.fields.slug || organisingGroup.id

  let i = 0
  for (const countryCode of (organisingGroup.fields.countryCode || [])) {
    try {
      organisingGroup.geography.country.push(countryDataForCode(countryCode))
    } catch (e) {
      console.error(JSON.stringify(organisingGroup), e)
    }
    i++;
  }

  try {
    // Remove any keys not expected by the parser
    organisingGroup = organisingGroupSchema.parse(organisingGroup)
  } catch(e) {
    console.error(JSON.stringify(organisingGroup), e)
  }
  return organisingGroup
}

const fields: Array<keyof OrganisingGroup['fields']> = ['LastModified', 'slug', 'Name', 'Full Name', 'Country', 'countryCode', 'countryName', 'Solidarity Actions', 'IsUnion', 'Website', 'Twitter']

export const organisingGroupBase = () => airtableBase()<OrganisingGroup['fields']>(
  env.get('AIRTABLE_TABLE_NAME_GROUPS').default('Organising Groups').asString()
)

export async function getOrganisingGroups (selectArgs: QueryParams<OrganisingGroup['fields']> = {}): Promise<Array<OrganisingGroup>> {
  return new Promise((resolve, reject) => {
    const groups: OrganisingGroup[] = []

    function finish () {
      try {
        resolve(
          groups.filter(a =>
            organisingGroupSchema.safeParse(a).success === true
          )
        )
      } catch (e) {
        reject(e)
      }
    }

    organisingGroupBase().select({
      sort: [
        { field: "Name", direction: "asc", }
      ],
      fields: fields,
      maxRecords: 1000,
      // filterByFormula: 'COUNTA({Solidarity Actions}) > 0',
      view: env.get('AIRTABLE_TABLE_VIEW_ORGANISING_GROUPS').default('All Groups').asString(),
      ...selectArgs
    }).eachPage(function page(records, fetchNextPage) {
      try {
        records.forEach(function(record) {
          groups.push(formatOrganisingGroup(record._rawJson))
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

export async function getOrganisingGroupBy (selectArgs: QueryParams<OrganisingGroup['fields']> = {}, description?: string) {
  return new Promise<OrganisingGroup>((resolve, reject) => {
    organisingGroupBase().select({
      fields: fields,
      maxRecords: 1,
      view: env.get('AIRTABLE_TABLE_VIEW_ORGANISING_GROUPS').default('All Groups').asString(),
      ...selectArgs
    }).firstPage(function page(error, records) {
      try {
        if (error) console.error(error)
        if (error || !records?.length) {
          return reject(`No group was found for filter ${JSON.stringify(selectArgs)}`)
        }
        const organisingGroup = records?.[0]._rawJson
        resolve(formatOrganisingGroup(organisingGroup))
      } catch(e) {
        reject(e)
      }
    })
  })
}

export async function getOrganisingGroupsByCountryCode (iso2: string) {
  const filterByFormula = `FIND("${iso2}", ARRAYJOIN({countryCode})) > 0`
  return getOrganisingGroups({ filterByFormula })
}

export async function getOrganisingGroupsByCountryId (id: string) {
  const filterByFormula = `FIND("${id}", ARRAYJOIN({Country})) > 0`
  return getOrganisingGroups({ filterByFormula })
}

export async function getOrganisingGroupByName (name: string) {
  return getOrganisingGroupBy({
    filterByFormula: `{Name}="${name}"`
  })
}

export type OrganisingGroupData = {
  organisingGroup: OrganisingGroup
}

export const getOrganisingGroupDataByName = async (name: string): Promise<OrganisingGroupData> => {
  const organisingGroup = await getOrganisingGroupByName(name)
  if (!organisingGroup) {
    throw new Error("No such organising group was found for this code.")
  }

  const solidarityActions = await getLiveSolidarityActionsByOrganisingGroupId(organisingGroup.id)

  return {
    organisingGroup: {
      ...organisingGroup,
      solidarityActions
    }
  }
}

export async function getSingleOrganisingGroup (id: string) {
  const filterByFormula = `OR({slug}="${id}", RECORD_ID()="${id}")`
  return getOrganisingGroupBy({ filterByFormula })
}

export function groupUrl(group: OrganisingGroup): string {
  return `/group/${group.slug}`
}