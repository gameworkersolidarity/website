export function airtableFilterOperation (operation: string, ...args: (string | undefined | null)[]): string {
  return `${operation}(${args.filter(Boolean).join(', ')})`
}

export function airtableFilterOR (...args: (string | undefined | null)[]): string {
  return airtableFilterOperation('OR', ...args)
}

export function airtableFilterAND (...args: (string | undefined | null)[]): string {
  return airtableFilterOperation('AND', ...args)
}