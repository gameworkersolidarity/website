import type { NextApiRequest, NextApiResponse } from 'next'
import { OrganisingGroup } from '../../data/types';
import { corsGET, runMiddleware } from '../../utils/cors';
import { getOrganisingGroupsByCountryCode } from '../../data/organisingGroup';

export type UnionsByCountryData = { unionsByCountry: OrganisingGroup[], iso2 }

export default async function handler (req: NextApiRequest, res: NextApiResponse<UnionsByCountryData>) {
  await runMiddleware(req, res, corsGET)
  let { iso2 } = req.query
  try {
    if (!iso2) {
      throw new Error("You must provide the iso2 query parameter")
    }
    const data = await getOrganisingGroupsByCountryCode(String(iso2))
    res.json({ unionsByCountry: data, iso2 })
  } catch (error) {
    res.status(400).json({ error: error.toString() } as any)
  }
}