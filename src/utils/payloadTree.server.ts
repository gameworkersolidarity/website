'use server'

import { CollectionSlug, DataFromCollectionSlug } from 'payload'
import { ArchiveBreadcrumb } from './payloadTree'
import { getPath } from '@/utils/payloadPath'
import { Breadcrumb } from '@payloadcms/plugin-nested-docs/types'
import { payloadUserQuery } from '@/utils/payload.server'
import type { Payload } from 'payload'

/** Minimal root company info when building hierarchy for a specific company page */
export type DescendantsRootCompany = { id: string; name: string; slug: string }

export async function getDescendants<S extends CollectionSlug, D extends DataFromCollectionSlug<S>>(
  collection: S,
  slug: string,
  data?: D[],
  query?: Payload['find'],
  rootCompany?: DescendantsRootCompany,
): Promise<ArchiveBreadcrumb[]> {
  const runQuery = query ?? payloadUserQuery
  let breadcrumbs: DataFromCollectionSlug<S>[]
  if (data) {
    breadcrumbs = data
  } else {
    const fetchedBreadcrumbs = await runQuery({
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
      const slugFromUrl = breadcrumb.url!.split('/').pop()!
      breadcrumbDictionary.set(breadcrumb.doc, {
        name: breadcrumb.label,
        slug: slugFromUrl,
        id: breadcrumb.doc,
        breadcrumbPath: breadcrumb.url!,
        slugPath: breadcrumb.url?.split('/') || [],
        path: getPath(collection, { slug: slugFromUrl } as unknown as any),
      })
    }
  }

  // Ensure subsidiaries appear even when their breadcrumbs (parents) are stale:
  // include direct children via the parent relationship and ensure root is in the tree.
  if (collection === 'companies' && rootCompany) {
    const rootSlug = rootCompany.slug
    const rootPath = `/${rootSlug}`

    if (!breadcrumbDictionary.has(rootCompany.id)) {
      breadcrumbDictionary.set(rootCompany.id, {
        id: rootCompany.id,
        name: rootCompany.name,
        slug: rootSlug,
        breadcrumbPath: rootPath,
        slugPath: [rootSlug],
        path: getPath('companies', { slug: rootSlug } as unknown as any),
      })
    }

    const directChildren = await runQuery({
      collection: 'companies',
      where: { parent: { equals: rootCompany.id } },
      depth: 0,
      limit: 0,
      pagination: false,
    })
    const children = (directChildren.docs ?? []) as Array<{
      id: string
      name: string
      slug: string
    }>
    for (const child of children) {
      const childId = String(child.id)
      if (breadcrumbDictionary.has(childId)) continue
      const childSlug = child.slug ?? String(child.id)
      const childPath = `${rootPath}/${childSlug}`
      breadcrumbDictionary.set(childId, {
        id: childId,
        name: child.name,
        slug: childSlug,
        breadcrumbPath: childPath,
        slugPath: [rootSlug, childSlug],
        path: getPath('companies', { slug: childSlug } as unknown as any),
      })
    }
  }

  return Array.from(breadcrumbDictionary.values())
}
