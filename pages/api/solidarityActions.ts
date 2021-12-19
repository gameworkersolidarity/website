import type { NextApiRequest, NextApiResponse } from 'next'
import { SolidarityAction } from '../../data/types';
import { getLiveSolidarityActions } from '../../data/solidarityAction';
import { corsGET, runMiddleware } from '../../utils/cors';

export type SolidarityActionsData = {
  solidarityActions: SolidarityAction[]
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<SolidarityActionsData>) {
  await runMiddleware(req, res, corsGET)
  const solidarityActions = await getLiveSolidarityActions()
  res.json({ solidarityActions })
}