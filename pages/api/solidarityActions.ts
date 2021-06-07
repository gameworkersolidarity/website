import type { NextApiRequest, NextApiResponse } from 'next'
import { SolidarityAction } from '../../data/types';
import { getSolidarityActions } from '../../data/solidarityAction';

export type SolidarityActionsData = {
  solidarityActions: SolidarityAction[]
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<SolidarityActionsData>) {
  const solidarityActions = await getSolidarityActions()
  res.json({ solidarityActions })
}