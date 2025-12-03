'use client'

import { CompanyLabel } from '@/components/CompanyLabel'
import { TreeView, TreeDataItem } from '@/components/ui/tree-view'
import { Company } from '@/payload-types'
import { ArchiveBreadcrumb } from '@/utils/payloadTree'
import { Building } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { twMerge } from 'tailwind-merge'

export function Descendants({
  breadcrumbs,
  initialSelectedItemId,
}: {
  breadcrumbs: ArchiveBreadcrumb[]
  initialSelectedItemId?: string
}) {
  const treeData = useMemo((): TreeDataItem[] => {
    const sortedBreadcrumbs = breadcrumbs
      .slice()
      // Sort by depth (shallowest first)
      .sort((a, b) => a.slugPath.length - b.slugPath.length)

    // Map to store TreeDataItem nodes by their breadcrumbPath for quick lookup
    const nodeMap = new Map<string, TreeDataItem>()
    const treeData: TreeDataItem[] = []

    for (const breadcrumb of sortedBreadcrumbs) {
      // Create TreeDataItem from breadcrumb
      const treeItem: TreeDataItem = {
        id: breadcrumb.id,
        name: breadcrumb.name,
        // children: [],
        // disabled: true
      }

      // Find parent by looking for a breadcrumb with a path that is a prefix
      // of the current breadcrumb's path
      let parentPath: string | null = null
      for (const otherBreadcrumb of sortedBreadcrumbs) {
        if (
          otherBreadcrumb.breadcrumbPath !== breadcrumb.breadcrumbPath &&
          breadcrumb.breadcrumbPath.startsWith(otherBreadcrumb.breadcrumbPath + '/')
        ) {
          // Check if this is a more specific parent (longer path)
          if (!parentPath || otherBreadcrumb.breadcrumbPath.length > parentPath.length) {
            parentPath = otherBreadcrumb.breadcrumbPath
          }
        }
      }

      // Add to node map
      nodeMap.set(breadcrumb.breadcrumbPath, treeItem)

      if (parentPath) {
        // Add as child of parent
        const parentNode = nodeMap.get(parentPath)
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = []
          }
          parentNode.children.push(treeItem)
          parentNode.children.sort((a, b) => a.name.localeCompare(b.name))
          // parentNode.disabled = false
        }
      } else {
        // No parent found, add to root
        treeData.push(treeItem)
      }
    }

    // Recursively set disabled: false on all items with no children
    // const setDisabledOnLeaves = (items: TreeDataItem[]) => {
    //   for (const item of items) {
    //     if (!item.children || item.children.length === 0) {
    //       item.disabled = true
    //     } else {
    //       // setDisabledOnLeaves(item.children)
    //     }
    //   }
    // }
    //
    // setDisabledOnLeaves(treeData)

    return treeData
  }, [breadcrumbs])

  return (
    <div className="flex flex-col gap-4">
      <TreeView
        expandAll={breadcrumbs.length <= 4}
        // initialSelectedItemId={breadcrumbs[0].id}
        initialSelectedItemId={initialSelectedItemId}
        data={treeData}
        renderItem={({ item }) => {
          const originalItem = breadcrumbs.find((b) => b.id === item.id)!
          return (
            <div className="flex items-center gap-2 text-base py-1">
              <CompanyLabel
                company={
                  {
                    id: item.id,
                    name: item.name,
                    slug: originalItem.slug,
                    path: originalItem.path,
                  } as Company
                }
                link
              />
            </div>
          )
        }}
      />
    </div>
  )
}

/**
 * 
  const data: TreeDataItem[] = [
    {
      id: '1',
      name: 'Item 1',
      children: [
        {
          id: '2',
          name: 'Item 1.1',
          children: [
            {
              id: '3',
              name: 'Item 1.1.1',
            },
            {
              id: '4',
              name: 'Item 1.1.2',
            },
          ],
        },
        {
          id: '5',
          name: 'Item 1.2 (disabled)',
          disabled: true,
        },
      ],
    },
    {
      id: '6',
      name: 'Item 2 (draggable)',
      draggable: true,
    },
  ]
 */
