import type { NextApiRequest, NextApiResponse } from 'next'
import { corsGET, runMiddleware } from '../../utils/cors';
import { getCountryDataByCode, CountryData } from '../../data/country';

export default async function handler (req: NextApiRequest, res: NextApiResponse<CountryData>) {
  await runMiddleware(req, res, corsGET)
  let { iso2 } = req.query
  try {
    if (!iso2) {
      throw new Error("You must provide the iso2 query parameter")
    }
    const data = await getCountryDataByCode(String(iso2))
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: error.toString() } as any)
  }
}