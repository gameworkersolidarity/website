import Airtable from 'airtable'
import env from 'env-var'
import type { NextApiRequest, NextApiResponse } from 'next'
import * as z from 'zod'
import { solidarityActionSchema } from '../../schema';
import { SolidarityAction } from '../../types';

const base = new Airtable({
  apiKey: env.get('AIRTABLE_API_KEY').required().asString()
}).base(
  env.get('AIRTABLE_BASE_ID').required().asString()
);

export type SolidarityActionsData = {
  solidarityActions: SolidarityAction[]
}

export default async (req: NextApiRequest, res: NextApiResponse<SolidarityActionsData>) => {
  const solidarityActions = await getSolidarityActions()
    .then(actions => actions.filter(a =>
      solidarityActionSchema.safeParse(a).success === true
    ))

  res.json({ solidarityActions })
}

async function getSolidarityActions (): Promise<Array<SolidarityAction>> {
  return new Promise((resolve, reject) => {
    const solidarityActions: SolidarityAction[] = []

    base(
      env.get('AIRTABLE_TABLE_NAME_SOLIDARITY_ACTIONS').required().asString()
    ).select({
        sort: [
          { field: "Date", direction: "desc", },
          { field: "Country", direction: "asc", }
        ],
        maxRecords: 1000,
        view: env.get('AIRTABLE_TABLE_VIEW_SOLIDARITY_ACTIONS').required().asString(),
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function(record) {
            solidarityActions.push(record._rawJson)
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();

    }, function done(err) {
        if (err) { reject(err); return; }
        resolve(solidarityActions)
    });
  })
}