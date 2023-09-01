// 1. set REVALIDATE_SECRET_TOKEN in DO
// 2. trigger webhook with REVALIDATE_SECRET_TOKEN and path

import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = req.query.secret?.toString()
  const path = req.query.path?.toString()

  // Check for secret to confirm this is a valid request
  if (!secret || secret !== process.env.REVALIDATE_SECRET_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  if (!path) {
    return res.status(400).json({ message: 'Invalid path' })
  }
 
  try {
    // this should be the actual path not a rewritten path
    // e.g. for "/blog/[slug]" this should be "/blog/post-1"
    await res.revalidate(path)
    // Index page lists all actions
    const INDEX_PAGE_PATHS = ["/action", "/group"]
    const indexPageContentHasChanged = INDEX_PAGE_PATHS.some(
      relevantPath => path.includes(relevantPath)
    )
    if (indexPageContentHasChanged) {
      await res.revalidate("/")
    }
    return res.json({ revalidated: true })
  } catch (err) {
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send('Error revalidating')
  }
}