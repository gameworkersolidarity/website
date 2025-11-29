'use server'

import { CollectionSlug } from 'payload'
import config from '@/payload.config'
import { getPayload } from 'payload'
import { Breadcrumb } from 'node_modules/@payloadcms/plugin-nested-docs/dist/types'
import { ArchiveBreadcrumb } from './payloadTree'
import { getPath } from '@/utils/payloadPath'

export async function getDescendants<T extends CollectionSlug>(collection: T, slug: string) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const breadcrumbs = await payload.find({
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
      breadcrumbDictionary.set(breadcrumb.doc, {
        name: breadcrumb.label,
        slug: breadcrumb.url!.split('/').pop()!,
        id: breadcrumb.doc,
        breadcrumbPath: breadcrumb.url!,
        path: getPath(collection, { slug }),
      })
    }
  }
  return Array.from(breadcrumbDictionary.values())
}
