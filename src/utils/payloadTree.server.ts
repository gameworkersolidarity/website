'use server'

import { CollectionSlug, DataFromCollectionSlug } from 'payload'
import config from '@/payload.config'
import { getPayload } from 'payload'
import { ArchiveBreadcrumb } from './payloadTree'
import { getPath } from '@/utils/payloadPath'
import { Breadcrumb } from '@payloadcms/plugin-nested-docs/types'

export async function getDescendants<S extends CollectionSlug, D extends DataFromCollectionSlug<S>>(
  collection: S,
  slug: string,
  data?: D[],
) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  let breadcrumbs: DataFromCollectionSlug<S>[]
  if (data) {
    breadcrumbs = data
  } else {
    const fetchedBreadcrumbs = await payload.find({
      collection: collection,
      where: {
        'parents.url': {
          contains: `/${slug}`,
        },
      },
    })
    breadcrumbs = fetchedBreadcrumbs.docs || []
  }
  const breadcrumbDictionary = new Map<string, ArchiveBreadcrumb>()
  for (const modelInstance of breadcrumbs || []) {
    for (const breadcrumb of (modelInstance as { parents: Breadcrumb[] }).parents || []) {
      const slug = breadcrumb.url!.split('/').pop()!
      breadcrumbDictionary.set(breadcrumb.doc, {
        name: breadcrumb.label,
        slug: slug,
        id: breadcrumb.doc,
        breadcrumbPath: breadcrumb.url!,
        slugPath: breadcrumb.url?.split('/') || [],
        path: getPath(collection, { slug } as unknown as any),
      })
    }
  }
  return Array.from(breadcrumbDictionary.values())
}
