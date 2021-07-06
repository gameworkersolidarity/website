import { SolidarityAction } from '../data/types';
import { memo, useCallback, useState, useRef, createContext, useContext, useMemo } from 'react';
import ReactMapGL, { Layer, MapRef, Marker, Source } from '@urbica/react-map-gl';
import env from 'env-var';
// import { stringifyArray } from '../utils/string';
import Emoji from 'a11y-react-emoji';
import Cluster from '@urbica/react-map-gl-cluster';
import 'mapbox-gl/dist/mapbox-gl.css';
import { theme } from 'twin.macro';
import * as polished from 'polished'
import router, { useRouter } from 'next/dist/client/router';
import { scrollToId } from '../utils/router';
import { FilterContext } from './Timeline';
import { scaleLinear, scalePow } from 'd3-scale';
import { max, median, min } from 'd3-array';
import { useContextualRouting } from 'next-use-contextual-routing';
import Link from 'next/link';
import { actionUrl } from '../data/solidarityAction';
import { DEFAULT_ACTION_DIALOG_KEY } from './SolidarityActions';

const defaultViewport = {
  latitude: 15,
  longitude: 0,
  zoom: 0.7,
}

const MapContext = createContext(defaultViewport)

export function Map({ data, onSelectCountry, ...initialViewport }: {
  data: SolidarityAction[], width?: any, height?: any, onSelectCountry?: (iso2id: string | null) => void
}) {
  const [viewport, setViewport] = useState({
    ...defaultViewport,
    // width: '100%',
    // height: 700,
    ...initialViewport,
  });

  const updateViewport = useCallback(nextViewport => setViewport(nextViewport), [])

  const ref = useRef<MapRef>(null)

  const { countries, hasFilters } = useContext(FilterContext)
  const displayStyle = !hasFilters ? 'summary' : 'detail'

  const countryCounts = useMemo(() => {
    const counts = data.reduce((countries, action) => {
      for (const code of action.fields.countryCode) {
        countries[code] ??= 0
        countries[code]++
      }
      return countries
    }, {} as CountryCounts)

    const domain = Object.values(counts)

    const colorScale = scalePow()
      .exponent(0.5)
      .domain([min(domain), median(domain), max(domain)] as number[])
      .range([theme`colors.gwBlue`, theme`colors.gwPink`, theme`colors.gwOrange`] as any)

    for (const code in counts) {
      const count = counts[code]
      counts[code] = colorScale(count)
    }

    return counts
  }, [data])

  return (
    <MapContext.Provider value={viewport}>
      <div className='relative overflow-hidden rounded-xl' style={{
        height: '100%',
        width: '100%'
      }}>
        <ReactMapGL
          style={{
            width: '100%',
            height: '100%'
          }}
          {...viewport}
          accessToken={env.get('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN').default('pk.eyJ1IjoiY29tbW9ua25vd2xlZGdlIiwiYSI6ImNrcHB2cnBoMDByNnUydm1uMm5qenB5bGoifQ.8ioYIcBD6YJaNvczuhLtEQ').asString()}
          mapStyle={env.get('NEXT_PUBLIC_MAPBOX_STYLE_URL').default('mapbox://styles/commonknowledge/ckqsa4g09145h17p84g69t7ns').asString()}
          onViewportChange={updateViewport}
          className="rounded-xl"
          ref={ref}
        >
          <ActionSource data={data} />
          <CountryLayer
            mode={displayStyle}
            countryCounts={countryCounts}
            onSelectCountry={onSelectCountry}
          />
          {/* {data.map(d => (
            <MapMarker key={d.id} data={d} />
          ))} */}
          <Cluster radius={20} extent={512} nodeSize={64} component={ClusterMarker}>
            {data.map(datum => (
              <Marker {...getCoordinatesForAction(datum)}>
                <div className='space-x-1 text-center transform'>
                  {!!datum.fields?.CategoryEmoji?.length && <span className='text-lg'><Emoji symbol={datum.fields.CategoryEmoji?.[0]} /></span>}
                  <br />
                  {/* <div className='inline capitalize-first'>{stringifyArray(datum.fields.Category)}</div> */}
                  <div style={{ opacity: viewport.zoom > 3 ? 1 : 0 }} className='transition duration-250 text-xs bg-gray-800 text-white inline capitalize font-bold tracking-tight  px-1 rounded-xl pointer-events-none'>
                    {datum.geography.location?.display_name?.split(',')?.[0] || datum.fields['countryName']}
                  </div>
                </div>
              </Marker>
            ))}
          </Cluster>
        </ReactMapGL>
      </div>
    </MapContext.Provider>
  );
}

function ActionSource ({ data }: { data: SolidarityAction[] }) {
  return (
    <Source id='actions' type='geojson' data={{
      type: "FeatureCollection",
      features: data.map(d => {
        const coords = getCoordinatesForAction(d)
        return {
          type: "Feature",
          id: d.id,
          properties: d,
          geometry: {
            type: "Point",
            coordinates: [coords.longitude, coords.latitude]
          }
        }
      })
    }} />
  )
}

type CountryCounts = { [iso2: string]: number }

const CountryLayer = memo(({
  mode,
  countryCounts,
  onSelectCountry
}: {
  mode: 'summary' | 'detail'
  countryCounts: CountryCounts
  onSelectCountry: any
}) => {
  // const [hoverCountry, setHoverCountry] = useState<string>('XX')

  return (
    <>
    <Source id="country-boundaries" {...{
      "type": "vector",
      "url": "mapbox://mapbox.country-boundaries-v1"
    }} />
    <Layer
      before='settlement-subdivision-label'
      {...{
        "id": "undisputed country boundary fill",
        "source": "country-boundaries",
        "source-layer": "country_boundaries",
        "type": "fill",
        "filter": [ "==", [ "get", "disputed" ], "false" ],
        "paint": {
          "fill-color": [
            "coalesce",
              ['get',
                ['get', 'iso_3166_1'],
                ["literal", countryCounts]
              ],
              theme`colors.gray.200`
          ],
        }
      }}
    />
    {/* <Layer
      onClick={event => {
        const countryIso2 = event.features?.[0]?.properties?.iso_3166_1
        if (Object.keys(countryCounts).includes(countryIso2)) {
          onSelectCountry?.(countryIso2)
        }
      }}
      onHover={event => {
        const countryIso2 = event.features?.[0]?.properties?.iso_3166_1
        if (Object.keys(countryCounts).includes(countryIso2)) {
          setHoverCountry(countryIso2)
        }
      }}
      onLeave={event => {
        // const countryIso2 = event.features?.[0]?.properties?.iso_3166_1
        setHoverCountry('XX')
      }}
      {...{
        "id": "undisputed country boundary fill hoverable",
        "source": "country-boundaries",
        "source-layer": "country_boundaries",
        "type": "fill",
        "filter": [ "==", [ "get", "disputed" ], "false" ],
        "paint": {
          "fill-color": [
            'case',
            ['==', ['get', 'iso_3166_1'], hoverCountry],
            polished.rgba(theme`colors.white`, 0.1),
            'rgba(0,0,0,0)'
          ],
        }
      }}
    /> */}
    </>
  )
})

function getCoordinatesForAction(data: SolidarityAction) {
  let geoData = {
    latitude: data.geography.country[0].latitude,
    longitude: data.geography.country[0].longitude
  }
  if (data?.geography?.location) {
    geoData = {
      latitude: parseFloat(data.geography.location.lat),
      longitude: parseFloat(data.geography.location.lon),
    }
  }
  return geoData
}

const MapMarker = memo(({ data }: { data: SolidarityAction }) => {
  const context = useContext(MapContext)
  const router = useRouter()
  const { makeContextualHref, returnHref }= useContextualRouting()

  return (
    <Marker {...getCoordinatesForAction(data)}>
      <div onClick={e => {
        e.preventDefault()
        router.push(
          makeContextualHref({ [DEFAULT_ACTION_DIALOG_KEY]: data.slug }),
          actionUrl(data),
          { shallow: true }
        )
      }}>
        <div className='space-x-1 text-center'>
          {!!data.fields?.CategoryEmoji?.length && (
            <div className='text-lg -mb-2'><Emoji symbol={data.fields.CategoryEmoji?.[0]} /></div>
          )}
          {/* <div className='inline capitalize-first'>{stringifyArray(data.fields.Category)}</div> */}
          <div style={{ opacity: context.zoom > 3 ? 1 : 0 }} className='transition duration-250 text-xs bg-gwYellow text-black inline capitalize font-bold tracking-tight  px-1 rounded-xl pointer-events-none'>
            {data.geography.location?.display_name?.split(',')?.[0] || data.fields['countryName']}
          </div>
        </div>
      </div>
    </Marker>
  )
})

const ClusterMarker = ({ longitude, latitude, pointCount }) => {
  return (
    <Marker longitude={longitude} latitude={latitude}>
      <div className='transition duration-250 text-xs bg-gray-800 text-white inline capitalize font-bold tracking-tight  px-1 rounded-xl pointer-events-none'>
        {pluralize('action', pointCount, true)}
      </div>
    </Marker>
  )
}