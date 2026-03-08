'use client'

import { useEffect } from 'react'

/**
 * Next.js template.tsx remounts when the segment (including [slug]) changes.
 * Scrolling to top here runs on every navigation to an action page.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/template
 */
export default function PageTemplate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return <>{children}</>
}
