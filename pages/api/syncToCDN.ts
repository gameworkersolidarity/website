import type { NextApiRequest, NextApiResponse } from 'next'
import { syncBlogPostsToCDN, syncSolidarityActionsToCDN, uploadToCDN } from "../../data/cdn";
import { runMiddleware, corsGET } from '../../utils/cors';
import { getLiveSolidarityActions } from '../../data/solidarityAction';
import { getBlogPosts } from '../../data/blogPost';

/**
 * Loop through airtable records and sync their attachments to CDN
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsGET)
  const uploads = await Promise.all([
    // (async () => {
    //   try {
    //     const actions = await getLiveSolidarityActions()
    //     return syncSolidarityActionsToCDN(actions)
    //   } catch (e) {
    //     return 0
    //   }
    // })(),
    (async () => {
      try {
        const posts = await getBlogPosts()
        return syncBlogPostsToCDN(posts)
      } catch (e) {
        return 0
      }
    })()
  ])
  const uploadCount = uploads.reduce((sum, next) => sum + next, 0)
  return res.status(200).json(uploadCount)
}