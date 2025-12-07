import { CollectionSlug } from 'payload'
import type {
  Company,
  Country,
  Config,
  Category,
  Campaign,
  OrganisingGroup,
  Event,
  BlogPost,
  StaticPage,
} from '@/payload-types'

export function getSlug<C extends CollectionSlug>(collection: C, record: Config['collections'][C]) {
  switch (collection) {
    case 'companies':
      return (record as Company).slug
    case 'countries':
      return (record as Country).slug
    case 'categories':
      return (record as Category).slug
    case 'campaigns':
      return (record as Campaign).slug
    case 'organisingGroups':
      return (record as OrganisingGroup).slug
    case 'events':
      return (record as Event).slug
    case 'blogPosts':
      return (record as BlogPost).slug
    case 'staticPages':
      return (record as StaticPage).slug
    default:
      return ''
  }
}

export function getPath<C extends CollectionSlug>(collection: C, record: Config['collections'][C]) {
  switch (collection) {
    case 'companies':
      return `/companies/${getSlug(collection, record)}`
    case 'countries':
      return `/countries/${getSlug(collection, record)}`
    case 'categories':
      return `/categories/${getSlug(collection, record)}`
    case 'campaigns':
      return `/campaigns/${getSlug(collection, record)}`
    case 'organisingGroups':
      return `/organising-groups/${getSlug(collection, record)}`
    case 'events':
      return `/events/${getSlug(collection, record)}`
    case 'blogPosts':
      return `/articles/${getSlug(collection, record)}`
    case 'staticPages':
      return `/${getSlug(collection, record)}`
    default:
      return '/'
  }
}
