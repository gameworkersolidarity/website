import { WebMercatorViewport } from '@math.gl/web-mercator'
import coords from 'country-coords'
const coordsByCountry = coords.byCountry()
import { toBBOX } from 'country-to-bbox'
import countryFlagEmoji from 'country-flag-emoji'
import i18nIsoCountries from 'i18n-iso-countries'
import { projectStrings } from '@/project-strings'
import qs from 'query-string'

export const getViewportForFeatures = (
  viewport: ConstructorParameters<typeof WebMercatorViewport>[0],
  addressBounds: [number, number, number, number],
  fitBoundsArgs: Parameters<WebMercatorViewport['fitBounds']>[1],
) => {
  try {
    // Create a calculator to generate new viewports
    const parsedViewport = new WebMercatorViewport(viewport)
    if (!addressBounds.every((n) => n !== Infinity)) return
    const newViewport = parsedViewport.fitBounds(bboxToBounds(addressBounds as any), fitBoundsArgs)
    return newViewport
  } catch (error) {
    // Famously quite fragile
    return null
  }
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

export const geocodeOpenStreetMap = async (location: string, iso2: string) => {
  const url = qs.stringifyUrl({
    url: `https://nominatim.openstreetmap.org/search.php`,
    query: {
      q: location,
      countrycodes: iso2,
      format: 'jsonv2',
      'accept-language': 'en-GB',
      limit: 1,
      email: projectStrings.email,
    },
  })
  const res = await fetch(url)
  const data = await res.json()
  return data?.[0] as Promise<OpenStreetMapReverseGeocodeResponse | null>
}

export interface OpenStreetMapReverseGeocodeResponse {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  place_rank: number
  category: string
  type: string
  importance: number
  addresstype?: string
  name?: string
  display_name: string
  address?: Address
  boundingbox: string[]
}

export interface Address {
  continent?: string

  country?: string
  country_code?: string

  region?: string
  state?: string
  state_district?: string
  county?: string

  municipality?: string
  city?: string
  town?: string
  village?: string

  city_district?: string
  district?: string
  borough?: string
  suburb?: string
  subdivision?: string

  hamlet?: string
  croft?: string
  isolated_dwelling?: string

  neighbourhood?: string
  allotments?: string
  quarter?: string

  city_block?: string
  residental?: string
  farm?: string
  farmyard?: string
  industrial?: string
  commercial?: string
  retail?: string

  road?: string

  house_number?: string
  house_name?: string

  emergency?: string
  historic?: string
  military?: string
  natural?: string
  landuse?: string
  place?: string
  railway?: string
  man_made?: string
  aerialway?: string
  boundary?: string
  amenity?: string
  aeroway?: string
  club?: string
  craft?: string
  leisure?: string
  office?: string
  mountain_pass?: string
  shop?: string
  tourism?: string
  bridge?: string
  tunnel?: string
  waterway?: string
}
