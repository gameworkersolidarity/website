import { Action } from './payload-types'

export type LexicalContent = Action['description']

export type TimelineLabelProperty =
  | 'categories'
  | 'companies'
  | 'organisingGroups'
  | 'countries'
  | 'location'
  | 'name'
  | 'headcount'
