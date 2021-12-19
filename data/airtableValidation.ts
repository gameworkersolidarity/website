import { SolidarityAction } from './types';

const lowercaseAlphanumericSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function validateAirtableAction (action: Pick<SolidarityAction, 'slug'>): boolean {
  return !!action.slug.match(lowercaseAlphanumericSlugRegex)
}