import type { MetadataRoute } from 'next'
import { projectStrings } from '@/project-strings'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/preview/'],
      },
    ],
    sitemap: `${projectStrings.baseUrl}/sitemap.xml`,
  }
}
