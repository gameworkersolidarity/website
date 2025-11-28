export function getCSSVariable(variable: string) {
  if (typeof window === 'undefined' || !document || typeof getComputedStyle !== 'function') {
    return ''
  }
  return getComputedStyle(document.documentElement).getPropertyValue(variable)
}
