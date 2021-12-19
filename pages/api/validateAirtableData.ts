import type { NextApiRequest, NextApiResponse } from 'next'
import { Country, SolidarityAction, SolidarityActionAirtableRecord } from '../../data/types';
import { corsGET, runMiddleware } from '../../utils/cors';
import { getAllSolidarityActions, solidarityActionBase } from '../../data/solidarityAction';
import { validateAirtableAction } from '../../data/airtableValidation';
import { chunk } from 'lodash'

export default async function handler (req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await runMiddleware(req, res, corsGET)
    const actions = await getAllSolidarityActions()
    const updateList: Array<{
      id: SolidarityActionAirtableRecord['id'],
      fields: Partial<SolidarityActionAirtableRecord['fields']>
    }> = []
    for (const airtableRecord of actions) {
      const newValidStatus = validateAirtableAction(airtableRecord)
      if (newValidStatus != airtableRecord.fields.hasPassedValidation) {
        updateList.push({
          id: airtableRecord.id,
          fields: { hasPassedValidation: newValidStatus }
        })
      }
    }
    let recordsUpdated = 0
    for (const chunkedUpdate of chunk(updateList, 10)) {
      recordsUpdated += (await update(chunkedUpdate)).length
    }
    return res.status(200).json({ recordsUpdated })
  } catch (error) {
    res.status(400).json({ error: error.toString() } as any)
    // TODO: Trigger Slack / Github Action error
  }
}

async function update (updates: any[]) {
  return new Promise<SolidarityActionAirtableRecord[]>((resolve, reject) => {
    solidarityActionBase().update(updates, function(err, records) {
      if (err) {  
        console.error(err)
        throw new Error(err)
        reject(err)
      }
      resolve(records)
    });
  })
}