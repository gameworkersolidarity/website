// 1. set REVALIDATE_SECRET_TOKEN in DO
// 2. trigger webhook with REVALIDATE_SECRET_TOKEN and path

export default async function handler(req, res) {
  const secret = req.query.secret
  const path = req.query.path

  // Check for secret to confirm this is a valid request
  if (secret !== process.env.REVALIDATE_SECRET_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' })
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