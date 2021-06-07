import { SolidarityAction } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { solidarityActionSchema } from './schema';

const validFilter = 'AND(Public, Name!="", Date!="", Country!="")'
const fields =['Name', 'Location', 'Summary', 'Date', 'Link', 'Country', 'Public']

export async function getSolidarityActions (): Promise<Array<SolidarityAction>> {
  return new Promise((resolve, reject) => {
    const solidarityActions: SolidarityAction[] = []

    airtableBase(
      env.get('AIRTABLE_TABLE_NAME_SOLIDARITY_ACTIONS').required().asString()
    ).select({
      filterByFormula: validFilter,
      sort: [
        { field: "Date", direction: "desc", },
        { field: "Country", direction: "asc", }
      ],
      fields: fields,
      maxRecords: 1000,
      view: env.get('AIRTABLE_TABLE_VIEW_SOLIDARITY_ACTIONS').required().asString(),
    }).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        solidarityActions.push(record._rawJson)
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