import env from 'env-var'
import type { NextApiRequest, NextApiResponse } from 'next'
import { solidarityActionSchema } from '../../data/schema';
import { SolidarityAction } from '../../data/types';
import { airtableBase } from '../../data/airtable';

export type SolidarityActionsData = {
  solidarityActions: SolidarityAction[]
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<SolidarityActionsData>) {
  const solidarityActions = await getSolidarityActions()

  res.json({ solidarityActions })
}

export async function getSolidarityActions (): Promise<Array<SolidarityAction>> {
  return new Promise((resolve, reject) => {
    const solidarityActions: SolidarityAction[] = []

    airtableBase(
      env.get('AIRTABLE_TABLE_NAME_SOLIDARITY_ACTIONS').required().asString()
    ).select({
      filterByFormula: 'AND(Public, Name!="", Date!="", Country!="")',
      sort: [
        { field: "Date", direction: "desc", },
        { field: "Country", direction: "asc", }
      ],
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