import { Category, Company, Country, OrganisingGroup } from '@/payload-types'

// Type guards
export function isCountry(obj: string | Country): obj is Country {
  return typeof obj === 'object' && obj !== null && 'countryCode' in obj
}

export function isCategory(obj: string | Category): obj is Category {
  return typeof obj === 'object' && obj !== null && 'Name' in obj
}

export function isCompany(obj: string | Company): obj is Company {
  return typeof obj === 'object' && obj !== null && 'Name' in obj
}

export function isOrganisingGroup(obj: string | OrganisingGroup): obj is OrganisingGroup {
  return typeof obj === 'object' && obj !== null && 'Name' in obj
}
