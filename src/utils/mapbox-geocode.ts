import env from 'env-var'

/**
 * Mapbox Geocoding API v6 response types
 */
export interface MapboxGeocodeResponse {
  type: 'FeatureCollection'
  features: MapboxFeature[]
  attribution: string
}

export interface MapboxFeature {
  type: 'Feature'
  id: string
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  properties: {
    mapbox_id: string
    feature_type: string
    name: string
    place_formatted?: string
    full_address?: string
    coordinates?: {
      longitude: number
      latitude: number
      accuracy?: string
    }
    context?: MapboxContext
  }
}

export interface MapboxContext {
  country?: {
    mapbox_id: string
    name: string
    country_code: string
    country_code_alpha_3?: string
    wikidata_id?: string
  }
  region?: {
    mapbox_id: string
    name: string
    region_code?: string
    region_code_full?: string
    wikidata_id?: string
  }
  place?: {
    mapbox_id: string
    name: string
    wikidata_id?: string
  }
  locality?: {
    mapbox_id: string
    name: string
    wikidata_id?: string
  }
  neighborhood?: {
    mapbox_id: string
    name: string
    wikidata_id?: string
  }
  postcode?: {
    mapbox_id: string
    name: string
  }
  district?: {
    mapbox_id: string
    name: string
    wikidata_id?: string
  }
  street?: {
    mapbox_id: string
    name: string
  }
  address?: {
    mapbox_id: string
    address_number?: string
    street_name?: string
    name: string
  }
}

export interface GeocodeResult {
  countryCode?: string
  countryName?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  placeName?: string
  regionName?: string
}

/**
 * Geocode a location using Mapbox Geocoding API v6 and extract country information
 * @param location - The location string to geocode (e.g., "England, Quebec")
 * @param countryFilter - Optional ISO A2 country code to filter results
 * @returns GeocodeResult with country code and other location details, or null if geocoding fails
 */
export async function geocodeWithMapboxV6(
  location: string,
  countryFilter?: string,
): Promise<GeocodeResult | null> {
  const mapboxToken = env.get('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN').asString()

  if (!mapboxToken) {
    console.warn('Mapbox access token not found, geocoding will fail')
    return null
  }

  if (!location || !location.trim()) {
    return null
  }

  // Build Mapbox v6 geocoding URL
  // Endpoint: https://api.mapbox.com/search/geocode/v6/forward
  const searchText = encodeURIComponent(location.trim())
  const countryParam = countryFilter ? `&country=${countryFilter}` : ''
  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${searchText}&access_token=${mapboxToken}&limit=5&types=place,locality,neighborhood,address${countryParam}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`Mapbox v6 geocoding failed: ${res.status} ${res.statusText}`)
      return null
    }

    const data = (await res.json()) as MapboxGeocodeResponse

    if (!data.features || data.features.length === 0) {
      return null
    }

    // Find the best match
    let bestFeature = data.features[0]

    // If we have a country filter, prefer results from that country
    if (countryFilter) {
      const countryMatch = data.features.find((feature) => {
        const countryCode = feature.properties.context?.country?.country_code?.toUpperCase()
        return countryCode === countryFilter.toUpperCase()
      })
      if (countryMatch) {
        bestFeature = countryMatch
      }
    }

    // Prefer results that match the location name more closely
    const locationParts = location.split(',').map((p) => p.trim())
    const locationName = locationParts[0].toLowerCase()
    const nameMatch = data.features.find(
      (feature) =>
        feature.properties.name?.toLowerCase() === locationName ||
        feature.properties.place_formatted?.toLowerCase().includes(locationName),
    )
    if (nameMatch) {
      bestFeature = nameMatch
    }

    // Extract country information from context
    const context = bestFeature.properties.context
    const country = context?.country

    if (!country || !country.country_code) {
      return null
    }

    const coordinates = bestFeature.geometry.coordinates // [longitude, latitude]

    return {
      countryCode: country.country_code.toUpperCase(),
      countryName: country.name,
      coordinates: {
        latitude: coordinates[1],
        longitude: coordinates[0],
      },
      placeName: context?.place?.name || bestFeature.properties.name,
      regionName: context?.region?.name,
    }
  } catch (error: any) {
    console.warn(`Mapbox v6 geocoding error for "${location}":`, error.message)
    return null
  }
}
