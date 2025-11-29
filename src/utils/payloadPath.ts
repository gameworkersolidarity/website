import { CollectionSlug } from 'payload'

export function getPath(collection: CollectionSlug, args: { slug: string }) {
  switch (collection) {
    case 'companies':
      return `/companies/${args.slug}`
    case 'countries':
      return `/countries/${args.slug}`
    case 'categories':
      return `/categories/${args.slug}`
    case 'campaigns':
      return `/campaigns/${args.slug}`
    case 'organisingGroups':
      return `/organising-groups/${args.slug}`
    case 'events':
      return `/events/${args.slug}`
    case 'blogPosts':
      return `/blog/${args.slug}`
    case 'staticPages':
      return `/${args.slug}`
    default:
      return '/'
  }
}
