import type { NextApiRequest, NextApiResponse } from 'next'
import { corsGET, runMiddleware } from '../../utils/cors';
import { getStaticPageLinks } from '../../data/staticPage';
import { StaticPage } from '../../data/types';

export type LinksData = {
  links: StaticPage[]
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<LinksData>) {
  await runMiddleware(req, res, corsGET)
  const links = await getStaticPageLinks()
  res.json({ links })
}