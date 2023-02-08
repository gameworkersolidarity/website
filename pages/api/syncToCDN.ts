import type { NextApiRequest, NextApiResponse } from 'next'
import { syncSolidarityActionsToCDN, uploadToCDN } from "../../data/cdn";
import { runMiddleware, corsGET } from '../../utils/cors';
import { getLiveSolidarityActions } from '../../data/solidarityAction';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsGET)
  // Loop through airtable actions
  // and sync their `Document` property to CDN with uploadToCDN
  const hasAttachments = `NOT({Document} = "")`
  const hasNoCDNURLs = `OR(({cdn_urls} = ""),({cdn_urls} = "[]"))`
  const actions = await getLiveSolidarityActions({ filterByFormula: `AND(${hasAttachments},${hasNoCDNURLs})` })
  const updateReport = await syncSolidarityActionsToCDN(actions)
  return res.status(200).json(updateReport)
}