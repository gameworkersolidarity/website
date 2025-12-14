import { Event } from './payload-types'

export type LexicalContent = Event['description']

export type TimelineLabelProperty =
  | 'categories'
  | 'companies'
  | 'organisingGroups'
  | 'countries'
  | 'location'
  | 'name'
  | 'headcount'
