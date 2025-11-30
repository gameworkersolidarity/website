export type ArchiveBreadcrumb = {
  // Known as 'label' in nested plugin
  name: string
  // Extracted from 'url' from nested plugin
  slug: string
  // Document ID from nested plugin
  id: string
  // Known as 'url' in nested plugin
  breadcrumbPath: string
  // Split breadcrumbPath
  slugPath: string[]
  // Derived from 'url' from nested plugin and collection name
  path: string
}
