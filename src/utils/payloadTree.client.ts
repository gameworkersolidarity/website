'use client'

import { CollectionSlug, DataFromCollectionSlug } from 'payload'
import { Breadcrumb } from '@payloadcms/plugin-nested-docs/types'
import { payloadClient } from './payload'
import { ArchiveBreadcrumb } from './payloadTree'
import { getPath } from '@/utils/payloadPath'
import { Config } from '@/payload-types'

export async function getDescendants<S extends CollectionSlug, D extends DataFromCollectionSlug<S>>(
  collection: S,
  slug: string,
  data?: D[],
) {
  let breadcrumbs: DataFromCollectionSlug<S>[]
  if (data) {
    breadcrumbs = data
  } else {
    const fetchedBreadcrumbs = await payloadClient.find({
      collection: collection,
      where: {
        'parents.url': {
          contains: `/${slug}`,
        },
      },
    })
    breadcrumbs = (fetchedBreadcrumbs.docs ?? []) as DataFromCollectionSlug<S>[]
  }
  const breadcrumbDictionary = new Map<string, ArchiveBreadcrumb>()
  for (const modelInstance of breadcrumbs || []) {
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
