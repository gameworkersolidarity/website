'use client'

import { CollectionSlug } from 'payload'
import { Breadcrumb } from 'node_modules/@payloadcms/plugin-nested-docs/dist/types'
import { payloadClient } from './payload'
import { ArchiveBreadcrumb } from './payloadTree'
import { getPath } from '@/utils/payloadPath'

export async function getDescendants<T extends CollectionSlug>(collection: T, slug: string) {
  const breadcrumbs = await payloadClient.find({
    collection: collection,
    where: {
      'breadcrumbs.url': {
        contains: `/${slug}`,
      },
    },
  })
  const breadcrumbDictionary = new Map<string, ArchiveBreadcrumb>()
  for (const modelInstance of breadcrumbs.docs || []) {
    for (const breadcrumb of (modelInstance as { breadcrumbs: Breadcrumb[] }).breadcrumbs || []) {
      const docId = typeof breadcrumb === 'string' ? breadcrumb : breadcrumb.doc
      if (docId) {
        breadcrumbDictionary.set(docId, {
          name: breadcrumb.label,
          slug: breadcrumb.url!.split('/').pop()!,
          id: breadcrumb.doc,
          breadcrumbPath: breadcrumb.url!,
          path: getPath(collection, { slug }),
        })
      }
    }
  }
  return Array.from(breadcrumbDictionary.values())
}
