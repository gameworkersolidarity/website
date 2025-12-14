import chroma from 'chroma-js'

export function getCSSVariable(
  variable: string,
  convertToRGB: boolean = false,
  fallback: string = '',
) {
  try {
    if (
      typeof window === 'undefined' ||
      !document ||
      !document.documentElement ||
      typeof getComputedStyle !== 'function'
    ) {
      return fallback
    }
    const value = getComputedStyle(document.documentElement).getPropertyValue(variable)
    if (!!value && convertToRGB) {
      try {
        const hex = chroma(value).hex()
        return hex
      } catch {
        return value
      }
    }
    return value
  } catch {
    return fallback
  }
}
