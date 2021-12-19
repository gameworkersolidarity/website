import bbox from '@turf/bbox';
import combine from '@turf/combine';
import ReactMapGL, { Layer, MapContext, Marker, Popup, Source } from '@urbica/react-map-gl';
import Cluster from '@urbica/react-map-gl-cluster';
import Emoji from 'a11y-react-emoji';
import cx from 'classnames';
import { max, median, min } from 'd3-array';
import { scalePow } from 'd3-scale';
import { format } from 'date-fns';
import env from 'env-var';
import { Dictionary, groupBy, merge } from 'lodash';
import { Map as MapboxMap } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useContextualRouting } from 'next-use-contextual-routing';
import { useRouter } from 'next/dist/client/router';
import pluralize from 'pluralize';
import { createContext, Dispatch, memo, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Supercluster from 'supercluster';
import { theme } from 'twin.macro';
import { actionUrl } from '../data/solidarityAction';
import { SolidarityAction } from '../data/types';
import { bboxToBounds, getViewportForFeatures } from '../utils/geo';
import { ActionMetadata, DEFAULT_ACTION_DIALOG_KEY } from './SolidarityActions';
import { FilterContext } from './Timeline';

const defaultViewport = {
  latitude: 15,
  longitude: 0,
  zoom: 0.7,
}

const ViewportContext = createContext(defaultViewport)

const OpenFullScreenSVG = (<svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><rect fill="none" height="24" width="24"/><polygon points="21,11 21,3 13,3 16.29,6.29 6.29,16.29 3,13 3,21 11,21 7.71,17.71 17.71,7.71"/></svg>)

const CloseFullScreenSVG = (<svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><rect fill="none" height="24" width="24"/><path d="M22,3.41l-5.29,5.29L20,12h-8V4l3.29,3.29L20.59,2L22,3.41z M3.41,22l5.29-5.29L12,20v-8H4l3.29,3.29L2,20.59L3.41,22z"/></svg>);

function createIdFromActions(actions) {
  return actions.map(({ id }) => id).join('-')
}

export function Map({ data, onSelectCountry, ...initialViewport }: {
  data: SolidarityAction[], width?: any, height?: any, onSelectCountry?: (iso2id: string | null) => void
}) {
  const [viewport, setViewport] = useState({
    ...defaultViewport,
    ...initialViewport,
  });

  const updateViewport = useCallback(nextViewport => setViewport(nextViewport), [])

  const mapRef = useRef<{ _map: MapboxMap }>(null)

  const { countries, hasFilters } = useContext(FilterContext)
  const displayStyle = !hasFilters ? 'summary' : 'detail'

  const countryCounts = useMemo(() => {
    const counts = data.reduce((countries, action) => {
      for (const code of action.fields.countryCode || []) {
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

  function calculateViewportForActions () {
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
      bbox(combine(FeatureCollection)) as any,
      { padding: 50 }
    )
    if (nextViewport) {
      setViewport({
        ...nextViewport,
        zoom: Math.min(10, nextViewport.zoom)
      })
    }
  }

  useEffect(() => {
    calculateViewportForActions()
  }, [allActionsSingleCountry, nationalActionsByCountry, data])

  const [openPopupId, setSelectedPopup] = useState<null | string>(null)

  const el = (
    <ViewportContext.Provider value={viewport}>
      <div
        className="w-full h-full relative rounded-xl overflow-hidden"
        style={{
          height: '100%',
          width: '100%'
        }}
      >
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
          {displayStyle === 'detail' && Object.entries(nationalActionsByCountryNoLocation).map(([countryCode, actionsUnlocated]) => {
            const clusterMarkerId = createIdFromActions(actionsUnlocated)
            return (
              <ClusterMarker
                clusterMarkerId={clusterMarkerId}
                key={clusterMarkerId}
                longitude={actionsUnlocated[0].geography.country[0].longitude}
                latitude={actionsUnlocated[0].geography.country[0].latitude}
                actions={actionsUnlocated}
                label={
                <Emoji symbol={actionsUnlocated[0].geography.country[0].emoji.emoji} label={actionsUnlocated[0].geography.country[0].name} />
                }
                isSelected={clusterMarkerId === openPopupId}
                setSelected={setSelectedPopup}
              />
            )
          })}
          {/* Location-specific markers */}
          {displayStyle === 'detail' && (
            <Cluster ref={_cluster} radius={50} extent={512} nodeSize={64} component={cluster => {
              const actions = _cluster.current?._cluster.getLeaves(cluster.clusterId).map(p => p.properties.props.data)
              const clusterMarkerId = createIdFromActions(actions)

              return (
                <ClusterMarker
                  clusterMarkerId={clusterMarkerId}
                  key={clusterMarkerId}
                  {...cluster}
                  actions={actions}
                  isSelected={clusterMarkerId === openPopupId}
                  setSelected={setSelectedPopup}
                />
              )
            }}>
              {data.filter(d => !!d.geography.location).map(d => (
                <MapMarker {...getCoordinatesForAction(d)} data={d} key={d.id} />
              ))}
            </Cluster>
          )}
        </ReactMapGL>
      </div>
    </ViewportContext.Provider>
  );

  return el
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
  const router = useRouter()
  const exampleAction = actions?.[0]
  return !exampleAction ? null : (
    <Popup latitude={lat} longitude={lng} closeButton={false} closeOnClick={false} className='min-w-[170px] country-popup'>
      <div
        className='px-2 py-2'
        onClick={() => router.push(
          `/?country=${exampleAction.fields.countrySlug?.[0] || ''}`,
          undefined,
          { shallow: false, scroll: false }
        )}
      >
        <div className='text-base'>
          <Emoji symbol={exampleAction.geography.country[0].emoji?.emoji} label='flag' />
          &nbsp;
          {exampleAction.geography.country[0].name}
        </div>
        <div className='text-xl'>
          {pluralize('action', actions.length, true)}
        </div>
        <div className='underline text-base'>
          View
        </div>
      </div>
    </Popup>
  )
})

function getCoordinatesForAction(data: SolidarityAction) {
  let geoData = {
    latitude: data.geography.country[0]?.latitude,
    longitude: data.geography.country[0]?.longitude
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
          <div className='transition duration-250 text-xs bg-white text-black inline capitalize font-bold tracking-tight  px-1 rounded-xl pointer-events-none'>
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

const ClusterMarker = ({ longitude, latitude, actions, label, isSelected, setSelected, clusterMarkerId }: {
  clusterMarkerId: string
  longitude: number
  latitude: number
  actions: SolidarityAction[],
  label?: any
  isSelected: boolean
  setSelected: Dispatch<SetStateAction<string | null>>
}) => {
  const router = useRouter()
  const { makeContextualHref, returnHref }= useContextualRouting()

  const marker = useRef<Marker>()
 
  useEffect(() => {
    if (marker.current._el) {
      if (isSelected) {
        (marker.current._el as HTMLDivElement).classList.add('z-30')
      } else {
        (marker.current._el as HTMLDivElement).classList.remove('z-30')
      }
    }
  }, [isSelected])

  return (
    <Marker ref={marker} longitude={longitude} latitude={latitude} anchor='bottom' className={isSelected ? 'z-30' : 'z-10'}>
      <div
        onClick={() => {
          if (isSelected) {
            setSelected(null)
          } else {
            setSelected(clusterMarkerId)
          }
        }}
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