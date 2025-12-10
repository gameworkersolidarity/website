'use client'

import { CollectionSlug } from 'payload'
import { Breadcrumb } from '@payloadcms/plugin-nested-docs/types'
import { payloadClient } from './payload'
import { ArchiveBreadcrumb } from './payloadTree'
import { getPath } from '@/utils/payloadPath'
import { Config } from '@/payload-types'

export async function getDescendants<T extends CollectionSlug>(collection: T, slug: string) {
  const breadcrumbs = await payloadClient.find({
    collection: collection,
    where: {
      'parents.url': {
        contains: `/${slug}`,
      },
    },
  })
  const breadcrumbDictionary = new Map<string, ArchiveBreadcrumb>()
  for (const modelInstance of breadcrumbs.docs || []) {
    for (const breadcrumb of (modelInstance as { parents: Breadcrumb[] }).parents || []) {
      const docId = typeof breadcrumb === 'string' ? breadcrumb : breadcrumb.doc
      if (docId) {
        const slug = breadcrumb.url!.split('/').pop()!
        breadcrumbDictionary.set(docId, {
          name: breadcrumb.label,
          slug: slug,
          id: breadcrumb.doc,
          breadcrumbPath: breadcrumb.url!,
          slugPath: breadcrumb.url?.split('/') || [],
          path: getPath(collection, { slug } as unknown as any),
        })
      }
    }
  }
  return Array.from(breadcrumbDictionary.values())
}
