import { WebMercatorViewport } from '@math.gl/web-mercator'
import coords from 'country-coords'
const coordsByCountry = coords.byCountry()
import { toBBOX } from 'country-to-bbox'
import countryFlagEmoji from 'country-flag-emoji'
import i18nIsoCountries from 'i18n-iso-countries'

export const getViewportForFeatures = (
  viewport: ConstructorParameters<typeof WebMercatorViewport>[0],
  addressBounds: [number, number, number, number],
  fitBoundsArgs: Parameters<WebMercatorViewport['fitBounds']>[1],
) => {
  // Create a calculator to generate new viewports
  const parsedViewport = new WebMercatorViewport(viewport)
  if (!addressBounds.every((n) => n !== Infinity)) return
  const newViewport = parsedViewport.fitBounds(bboxToBounds(addressBounds as any), fitBoundsArgs)
  return newViewport
}

export const bboxToBounds = (
  n: [number, number, number, number],
): [[number, number], [number, number]] => {
  return [
    [n[0], n[1]],
    [n[2], n[3]],
  ]
}

export interface CountryEmoji {
  code: string
  unicode: string
  name: string
  emoji: string
}

export function countryDataForCode(isoA2: string) {
  // Add country data
  const result = coordsByCountry.get(isoA2)
  if (!result) {
    return null
  }
  const { country: iso3166, ...countryCoordData } = result
  const emoji = countryFlagEmoji.get(isoA2) as CountryEmoji
  const bbox =
    emoji.name === 'France'
      ? [-5.4534286, 41.2632185, 9.8678344, 51.268318]
      : emoji.name === 'Malta'
        ? [14.1803710938, 35.8202148437, 14.5662109375, 36.07578125]
        : toBBOX(emoji.name === 'South Korea' ? 'S. Korea' : emoji.name)
  return {
    name: emoji.name,
    emoji,
    iso3166,
    bbox,
    ...countryCoordData,
  }
}

export function getBboxForCountry(isoA2: string) {
  const emoji = countryFlagEmoji.get(isoA2) as CountryEmoji
  return emoji.name === 'France'
    ? [-5.4534286, 41.2632185, 9.8678344, 51.268318]
    : emoji.name === 'Malta'
      ? [14.1803710938, 35.8202148437, 14.5662109375, 36.07578125]
      : toBBOX(emoji.name === 'South Korea' ? 'S. Korea' : emoji.name)
}

export function getEmojiForCountry(isoA2: string) {
  return countryFlagEmoji.get(isoA2) as CountryEmoji
}

export function getIsoA3ForCountry(isoA2: string) {
  return i18nIsoCountries.alpha2ToAlpha3(isoA2)
}

export function getNameForCountry(isoA2: string) {
  const emoji = countryFlagEmoji.get(isoA2) as CountryEmoji
  return emoji.name
}

export const getLatLngForCountry = (isoA2: string) => {
  const result = coordsByCountry.get(isoA2)
  if (!result) {
    return null
  }
  return {
    latitude: result.latitude,
    longitude: result.longitude,
  }
}
