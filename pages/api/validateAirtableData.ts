import type { NextApiRequest, NextApiResponse } from 'next'
import { Country, SolidarityAction } from '../../data/types';
import { corsGET, runMiddleware } from '../../utils/cors';
import { getAllSolidarityActions, solidarityActionBase } from '../../data/solidarityAction';
import equal from 'lodash.isequal'
import { validateAirtableAction } from '../../data/airtableValidation';

export default async function handler (req: NextApiRequest, res: NextApiResponse<Country>) {
  try {
    await runMiddleware(req, res, corsGET)
    const actions = await getAllSolidarityActions()
    const updateList: Array<{ id: SolidarityAction['id'], fields: Partial<SolidarityAction['fields']>}> = []
    for (const airtableRecord of actions) {
      const newValidStatus = validateAirtableAction(airtableRecord)
      if (newValidStatus != airtableRecord.fields.hasPassedValidation) {
        updateList.push({
          id: airtableRecord.id,
          fields: { hasPassedValidation: newValidStatus }
        })
      }
    }
    await solidarityActionBase().update(updateList, function(err, records) {
      if (err) throw new Error(err)
    });
    return res.status(200)
  } catch (error) {
    res.status(400).json({ error: error.toString() } as any)
    // TODO: Trigger Slack / Github Action error
  }
}