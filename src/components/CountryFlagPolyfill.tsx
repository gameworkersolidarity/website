'use client'

import { useEffect } from 'react'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'

/**
 * Injects a webfont so country flag emojis render as flags on Windows/Chromium
 * (where they otherwise show as two-letter codes like "FR" or "UK").
 * Only loads the font when the browser lacks native flag support.
 */
export function CountryFlagPolyfill() {
  useEffect(() => {
    polyfillCountryFlagEmojis()
  }, [])
  return null
}
