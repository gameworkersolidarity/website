import type { NextApiRequest, NextApiResponse } from 'next'
import { Company } from '../../data/types';
import { corsGET, runMiddleware } from '../../utils/cors';
import { getCompanyByName } from '../../data/company';

export default async function handler (req: NextApiRequest, res: NextApiResponse<Company>) {
  await runMiddleware(req, res, corsGET)
  let { name } = req.query
  try {
    if (!name) {
      throw new Error("You must provide the name query parameter")
    }
    const data = await getCompanyByName(String(name))
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: error.toString() } as any)
  }
}
