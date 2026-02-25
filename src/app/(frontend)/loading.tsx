import { HomepageSkeleton } from './components/HomepageSkeleton'

/**
 * Shown while the homepage (page.tsx) is loading. Uses in-component skeletons
 * instead of a generic "Loading..." so the layout matches the real page.
 */
export default function Loading() {
  return <HomepageSkeleton />
}
