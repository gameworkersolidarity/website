import { SolidarityActionAirtableRecord } from './types';

const lowercaseAlphanumericSlugRegex = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/

export function validateAirtableAction (action: SolidarityActionAirtableRecord): boolean {
  // Validate slug format
  const hasValidSlug = !!action.fields.slug?.match(lowercaseAlphanumericSlugRegex)
  
  // Validate required fields for SEO
  const hasRequiredFields = !!(
    action.fields.Name &&
    action.fields.Date &&
    action.fields.Summary && 
    action.fields.Summary.trim().length > 0
  )
  
  return hasValidSlug && hasRequiredFields
}