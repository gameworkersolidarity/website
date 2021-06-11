export function airtableFilterOperation (operation: string, ...args: string[]): string {
  return `${operation}(${args.filter(Boolean).join(', ')})`
}

export function airtableFilterOR (...args: string[]): string {
  return airtableFilterOperation('OR', ...args)
}

export function airtableFilterAND (...args: string[]): string {
  return airtableFilterOperation('AND', ...args)
}