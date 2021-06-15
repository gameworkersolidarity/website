import { projectStrings } from './site';
import qs from 'query-string';
import { OpenStreetMapReverseGeocodeResponse } from './types';

export const geocodeOpenStreetMap = async (location: string, iso2: string) => {
  const url = qs.stringifyUrl({
    url: `https://nominatim.openstreetmap.org/search.php`,
    query: {
      q: location,
      countrycodes: iso2,
      format: 'jsonv2',
      'accept-language': 'en-GB',
      limit: 1,
      email: projectStrings.email
    }
  })
  const res = await fetch(url)
  const data = await res.json()
  return data?.[0] as Promise<OpenStreetMapReverseGeocodeResponse | null>
}