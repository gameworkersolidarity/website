import chroma from 'chroma-js'

export function getCSSVariable(variable: string, convertToRGB: boolean = false) {
  if (typeof window === 'undefined' || !document || typeof getComputedStyle !== 'function') {
    return ''
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
}
