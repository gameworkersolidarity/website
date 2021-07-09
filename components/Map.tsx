import { SolidarityAction, Category, Country } from '../data/types';
import { memo, useCallback, useState, useRef, createContext, useContext, useMemo, useEffect } from 'react';
import ReactMapGL, { Layer, MapRef, Marker, Popup, Source, MapContext } from '@urbica/react-map-gl';
import env from 'env-var';
// import { stringifyArray } from '../utils/string';
import { format } from 'date-fns';
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
import { actionToFeature, actionUrl } from '../data/solidarityAction';
import { ActionMetadata, DEFAULT_ACTION_DIALOG_KEY, SolidarityActionCountryRelatedActions, SolidarityActionRelatedActions } from './SolidarityActions';
import pluralize from 'pluralize';
import Supercluster from 'supercluster';
import { stringifyArray } from '../utils/string';
import { ActionsContext } from '../pages';
import { Map as MapboxMap } from 'mapbox-gl'
import { Dictionary, groupBy, merge } from 'lodash';
import { bboxToBounds, getViewportForFeatures } from '../utils/geo';
import combine from '@turf/combine'
import bbox from '@turf/bbox';

const defaultViewport = {
  latitude: 15,
  longitude: 0,
  zoom: 0.7,
}

const ViewportContext = createContext(defaultViewport)

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

  const mapRef = useRef<{ _map: MapboxMap }>(null)

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

  const _cluster = useRef<{ _cluster: Supercluster<{ props: Parameters<typeof MapMarker>[0] }>}>(null)

  function groupActionsByCountry (actions: SolidarityAction[]) {
    const actionsWithSingleCountry = actions.reduce((actions, action) => {
      action.geography.country.forEach((c, i) => {
        actions.push(merge(action, {
          geography: {
            country: [action.geography.country[i]]
          },
          fields: {
            countryCode: [action.fields.countryCode?.[i]],
            countryName: [action.fields.countryName?.[i]],
            countrySlug: [action.fields.countrySlug?.[i]],
            Country: [action.fields.Country?.[i]],
          }
        } as Partial<SolidarityAction>))
      })
      return actions
    }, [] as SolidarityAction[])

    return groupBy(actionsWithSingleCountry, d => d.geography.country[0].iso3166)
  }
  
  const nationalActionsByCountryNoLocation = useMemo(() => {
    return groupActionsByCountry(data.filter(d => !d.geography.location))
  }, [data])

  const nationalActionsByCountry = useMemo(() => {
    return groupActionsByCountry(data)
  }, [data])

  const allActionsSingleCountry = useMemo(() => {
    return Object.values(nationalActionsByCountry).reduce((arr, a) => arr.concat(a), [])
  }, [nationalActionsByCountry])

  useEffect(() => {
    const setOfCountryBBOXes = Array.from(new Set(allActionsSingleCountry.map(d => d.geography.country[0].bbox)))
    
    const FeatureCollection: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
      type: 'FeatureCollection',
      features: setOfCountryBBOXes.map(bbox => {
        return {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            "coordinates": [bboxToBounds(bbox)]
          }
        }
      })
    }

    const nextViewport = getViewportForFeatures(
      {
        ...viewport,
        width: mapRef.current?._map.getCanvas().clientWidth || 0,
        height: mapRef.current?._map.getCanvas().clientHeight || 0
      },
      // data.map(d => d.geography.country[0].bbox),
      bbox(combine(FeatureCollection)) as any,
      { padding: 50 }
    )
    if (nextViewport) {
      setViewport({
        ...nextViewport,
        zoom: Math.min(10, nextViewport.zoom)
      })
    }
    // width: mapRef.current?._map.clientWidth,
    // height: mapRef.current?._map.clientHeight
    // { type: "FeatureCollection", features: addresses || [] }
  }, [allActionsSingleCountry, nationalActionsByCountry, data, viewport])

  return (
    <ViewportContext.Provider value={viewport}>
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
          ref={mapRef}
          viewportChangeMethod='flyTo'
        >
          <ActionSource data={data} />
          <CountryLayer
            mode={displayStyle}
            countryCounts={countryCounts}
            countryActions={nationalActionsByCountry}
            onSelectCountry={onSelectCountry}
          />
          {/* National events */}
          {Object.entries(
            displayStyle === 'summary'
            // In summary view, no other icons are on the map
            // So summarise all events in country-by-country clusters
            ? nationalActionsByCountry
            // When in detail view, display all locations
            // In which case, only continue to show national events which don't have a location
            : nationalActionsByCountryNoLocation
          ).map(([countryCode, actionsUnlocated]) => {
            return (
              <ClusterMarker
                key={countryCode}
                longitude={actionsUnlocated[0].geography.country[0].longitude}
                latitude={actionsUnlocated[0].geography.country[0].latitude}
                actions={actionsUnlocated}
                label={displayStyle === 'summary'
                  // In summary view, act as the container for all national events
                  ? <Emoji symbol={actionsUnlocated[0].geography.country[0].emoji.emoji} label={actionsUnlocated[0].geography.country[0].name} />
                  // In detail view, mimic the other clusters
                  : undefined}
              />
            )
          })}
          {/* Location-specific markers */}
          {displayStyle === 'detail' && (
            <Cluster ref={_cluster} radius={50} extent={512} nodeSize={64} component={cluster => (
              <ClusterMarker
                key={cluster.clusterId}
                {...cluster}
                actions={_cluster.current?._cluster.getLeaves(cluster.clusterId).map(p => p.properties.props.data)}
              />
            )}>
              {data.filter(d => !!d.geography.location).map(d => (
                <MapMarker {...getCoordinatesForAction(d)} data={d} key={d.id} />
              ))}
            </Cluster>
          )}
        </ReactMapGL>
      </div>
    </ViewportContext.Provider>
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
  countryActions,
  onSelectCountry
}: {
  mode: 'summary' | 'detail'
  countryCounts: CountryCounts
  countryActions: Dictionary<SolidarityAction[]>
  onSelectCountry: any
}) => {
  const [event, setEvent] = useState<{ lng: number, lat: number }>()
  const [hoverCountry, setHoverCountry] = useState<{
    color_group: number
    disputed: string
    iso_3166_1: string
    iso_3166_1_alpha_3: string
    name: string
    name_en: string
    region: string
    subregion: string
    wikidata_id: string
    worldview: string
  }>()
  const map = useContext<MapboxMap>(MapContext)

  // Reset the popup when you switch between summary and detail view
  const router = useRouter()
  useEffect(() => {
    const handleChange = (url, obj) => {
      setHoverCountry(undefined)
      setEvent(undefined)
    }
    router.events.on('routeChangeComplete', handleChange)
    return () => router.events.off('routeChangeComplete', handleChange)
  }, [])

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
    <Layer
      onClick={event => {
        const country = event.features?.[0]?.properties
        if (mode === 'summary') {
          if (country && Object.keys(countryCounts).includes(country.iso_3166_1)) {
            if (country.iso_3166_1 === hoverCountry?.iso_3166_1) {
              setEvent(undefined)
              setHoverCountry(undefined)
            } else {
              setEvent(event.lngLat)
              setHoverCountry(event.features?.[0]?.properties)
            }
          }
        }
      }}
      // onSelectCountry?.(countryIso2)
      onHover={event => {
        const country = event.features?.[0]?.properties
        if (country && Object.keys(countryCounts).includes(country.iso_3166_1)) {
          map.getCanvas().style.cursor = 'pointer'
        }
      }}
      onLeave={event => {
        map.getCanvas().style.cursor = ''
      }}
      {...{
        "id": "undisputed country boundary fill hoverable",
        "source": "country-boundaries",
        "source-layer": "country_boundaries",
        "type": "fill",
        "filter": [ "==", [ "get", "disputed" ], "false" ],
        "paint": {
          "fill-color": 'rgba(0,0,0,0)',
        }
      }}
    />
    {event && event.lat && event.lng && hoverCountry && (
      <CountryPopup
        {...event}
        actions={countryActions[hoverCountry.iso_3166_1]}
      />
    )}
    </>
  )
})

const CountryPopup = memo(({ lat, lng, actions }: {
  lat: number
  lng: number
  actions: SolidarityAction[]
}) => {
  const exampleAction = actions[0]
  return (
    <Popup latitude={lat} longitude={lng} closeButton={false} closeOnClick={false} className='w-[150px]'>
      <div className='text-base'>
        <SolidarityActionRelatedActions
          subtitle={'Country'}
          url={`/?country=${exampleAction.fields.countrySlug[0]}`}
          name={<span>
            <Emoji symbol={exampleAction.geography.country[0].emoji?.emoji} label='flag' />
            &nbsp;
            {exampleAction.geography.country[0].name}
          </span>}
          metadata={pluralize('action', actions.length, true)}
        />
      </div>
    </Popup>
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

const MapMarker = ({ data, ...coords }: { data: SolidarityAction, latitude: number, longitude: number }) => {
  const context = useContext(ViewportContext)
  const router = useRouter()
  const { makeContextualHref, returnHref }= useContextualRouting()

  return (
    <Marker {...coords}>
      <div onClick={e => {
        e.preventDefault()
        router.push(
          makeContextualHref({ [DEFAULT_ACTION_DIALOG_KEY]: data.slug }),
          actionUrl(data),
          { shallow: true }
        )
      }}>
        <div className='space-x-1 text-center'>
          {/* <div className='inline capitalize-first'>{stringifyArray(data.fields.Category)}</div> */}
          <div style={{ opacity: context.zoom > 1 ? 1 : 0 }} className='transition duration-250 text-xs bg-white text-black inline capitalize font-bold tracking-tight  px-1 rounded-xl pointer-events-none'>
            {!!data.fields?.CategoryEmoji?.length && (
              <span className='text-sm pr-1'><Emoji symbol={data.fields.CategoryEmoji?.[0]} /></span>
            )}
            {format(new Date(data.fields.Date), "MMM ''yy")}
          </div>
        </div>
      </div>
    </Marker>
  )
}

const ClusterMarker = ({ longitude, latitude, actions, label }: {
  longitude: number
  latitude: number
  actions: SolidarityAction[],
  label?: any
}) => {
  const [isSelected, setSelected] = useState(false)
  const toggleSelected = () => setSelected(s => !s)
  const router = useRouter()
  const { makeContextualHref, returnHref }= useContextualRouting()

  const marker = useRef<Marker>()
  useEffect(() => {
    if (marker.current._el) {
      if (isSelected) {
        (marker.current._el as HTMLDivElement).classList.add('z-50')
      } else {
        (marker.current._el as HTMLDivElement).classList.remove('z-50')
      }
    }
  }, [isSelected])

  return (
    <Marker ref={marker} longitude={longitude} latitude={latitude} anchor='bottom' className={isSelected ? 'z-50' : 'z-10'}>
      <div
        onClick={toggleSelected}
        className='relative'
      >
        <div className='text-center items-center inline-flex flex-row transition duration-250 bg-gwYellow text-black font-bold tracking-tight px-1 rounded-xl leading-none'>
          <span className='text-sm align-middle pr-1 leading-none'>
            {label || actions
              .reduce((categories, action) => {
                return Array.from(new Set(categories.concat(action.fields?.CategoryEmoji || [])))
              }, [] as string[])
              .map(emoji =>
                <Emoji symbol={emoji} key={emoji} className='leading-none' />
              )
            }
          </span>
          <span className='align-middle text-sm'>
            {actions.length}
          </span>
        </div>
        {isSelected && (
          <div className='bg-white p-1 rounded-xl max-w-md overflow-hidden truncate divide-y absolute top-100 left-0'>
            {actions.filter(Boolean).map(action => (
              <div
                key={action.slug}
              >
                <div
                  onClick={e => {
                    router.push(
                      makeContextualHref({ [DEFAULT_ACTION_DIALOG_KEY]: action.slug }),
                      actionUrl(action),
                      { shallow: true }
                    )
                  }}
                  className='hover:bg-gwOrangeLight transition duration-75 p-1 rounded-md'
                >
                  <ActionMetadata data={action} />
                  <div className='text-base -mt-1'>{action.fields.Name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Marker>
  )
}