import type { NextApiRequest, NextApiResponse } from 'next'
import { corsGET, runMiddleware } from '../../utils/cors';
import { MenuItem } from '../../data/types';
import { getMenuItems, getMenuItemsForSection } from '../../data/menuItem';

export type LinksData = {
  [key: string]: MenuItem[]
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<LinksData>) {
  await runMiddleware(req, res, corsGET)
  let { placement } = req.query
  if (placement && placement === 'Header') {
    res.json({ headerLinks: await getMenuItemsForSection('Header') })
  } else if (placement && placement === 'Footer') {
    res.json({ footerLinks: await getMenuItemsForSection('Footer') })
  } else {
    res.json({ links: await getMenuItems() })
  }
}