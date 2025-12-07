'use client'

import bbox from '@turf/bbox'
import combine from '@turf/combine'
import ReactMapGL, { Layer, MapContext, Marker, Source } from '@urbica/react-map-gl'
import Cluster from '@urbica/react-map-gl-cluster'
import Emoji from 'a11y-react-emoji'
import { max, median, min } from 'd3-array'
import { scalePow } from 'd3-scale'
import { format } from 'date-fns'
import env from 'env-var'
import { groupBy, merge } from 'lodash'
import { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRouter } from 'next/navigation'
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Supercluster from 'supercluster'
import { bboxToBounds, getViewportForFeatures } from '@/utils/geo'
import { ActionMetadata } from '@/components/EventCard'
import { Category, Country, Event } from '@/payload-types'
import MapGL from '@urbica/react-map-gl'
import { getCSSVariable } from '@/utils/css'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { useEventFilterContext } from '../EventFilterContextProvider'
import { getSlug } from '@/utils/payloadPath'
import { twMerge } from 'tailwind-merge'

const defaultViewport = {
  latitude: 15,
  longitude: 0,
  zoom: 0.7,
}

const ViewportContext = createContext(defaultViewport)

function createIdFromActions(events: Event[]) {
  return events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(({ id }) => id)
    .join('-')
}

export function Map({
  data,
  onSelectCountry,
  colorRange,
  countryFilter,
  ...initialViewport
}: {
  data: Event[]
  width?: any
  height?: any
  onSelectCountry?: (iso2id: string | null) => void
  colorRange?: string[]
  countryFilter?: string | null
}) {
  const [viewport, setViewport] = useState({
    ...defaultViewport,
    ...initialViewport,
  })

  const mapRef = useRef<MapGL>(null)

  const displayStyle = !countryFilter ? 'summary' : 'detail'

  const countryCounts = useMemo(() => {
    const counts = data.reduce((countries, event) => {
      for (const code of event.countries || []) {
        const cc = (code as Country).isoA2
        countries[cc] ??= 0
        countries[cc]++
      }

      return countries
    }, {} as CountryCounts)

    const domain = Object.values(counts)

    const colorScale = scalePow()
      .exponent(0.5)
      .domain([min(domain), median(domain), max(domain)] as number[])
      .range(colorRange as any)

    for (const code in counts) {
      const count = counts[code]
      counts[code] = colorScale(count)
    }

    return counts
  }, [data])

  const _cluster = useRef<{ _cluster: Supercluster<{ props: Parameters<typeof MapMarker>[0] }> }>(
    null,
  )

  function groupActionsByCountry(events: Event[]) {
    const eventsWithSingleCountry = events.reduce((events, event) => {
      event.countries?.forEach((_country, i) => {
        const country = _country as Country
        events.push(
          merge(event, {
            geography: {
              country: [country],
            },
            fields: {
              isoA2: [country.isoA2],
              countryName: [country.name],
              countrySlug: [getSlug('countries', country)],
              Country: [country],
            },
          } as Partial<Event>),
        )
      })
      return events
    }, [] as Event[])

    return groupBy(eventsWithSingleCountry, (d) => {
      return (d.countries?.[0] as Country)?.isoA2
    })
  }

  const nationalActionsByCountryNoLocation = useMemo(() => {
    return groupActionsByCountry(
      data.filter((d) => !d.coordinates?.longitude && !d.coordinates?.latitude),
    )
  }, [data])

  const nationalActionsByCountry = useMemo(() => {
    return groupActionsByCountry(data)
  }, [data])

  const allActionsSingleCountry = useMemo(() => {
    return Object.values(nationalActionsByCountry).reduce((arr, a) => arr.concat(a), [])
  }, [nationalActionsByCountry])

  const calculateViewportForActions = useCallback(() => {
    const setOfCountryBBOXes = Array.from(
      new Set(allActionsSingleCountry.map((d) => (d.countries?.[0] as Country)?.bbox)),
    )

    const FeatureCollection: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
      type: 'FeatureCollection',
      features: setOfCountryBBOXes
        .filter(
          (bbox) =>
            !!bbox &&
            Array.isArray(bbox) &&
            bbox.length === 4 &&
            bbox.every((n) => !isNaN(n as number)),
        )
        .map((bbox) => {
          return {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [bboxToBounds(bbox as [number, number, number, number])],
            },
          }
        }),
    }

    setViewport((viewport) => {
      const nextViewport = getViewportForFeatures(
        {
          ...viewport,
          width: mapRef.current?.getMap()?.getCanvas().clientWidth || 0,
          height: mapRef.current?.getMap()?.getCanvas().clientHeight || 0,
        },
        bbox(combine(FeatureCollection)) as [number, number, number, number],
        { padding: 50 },
      )

      if (!nextViewport) {
        return viewport
      }

      return {
        ...nextViewport,
        zoom: Math.min(10, nextViewport.zoom),
      }
    })
  }, [allActionsSingleCountry, setViewport])

  useEffect(() => {
    calculateViewportForActions()
  }, [calculateViewportForActions])

  const { selectedPopupIds, setSelectedPopupIds } = useEventFilterContext()

  const [elementRef, elementDimensions] = useElementSize()

  useEffect(() => {
    mapRef.current?.getMap()?.resize()
  }, [elementDimensions, setViewport])

  const el = (
    <ViewportContext.Provider value={viewport}>
      <div
        className="w-full h-full relative rounded-xl overflow-hidden"
        style={{
          height: '100%',
          width: '100%',
        }}
        ref={elementRef}
      >
        <ReactMapGL
          style={{
            width: '100%',
            height: '100%',
          }}
          {...viewport}
          accessToken={env
            .get('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN')
            .default(
              'pk.eyJ1IjoiY29tbW9ua25vd2xlZGdlIiwiYSI6ImNrcHB2cnBoMDByNnUydm1uMm5qenB5bGoifQ.8ioYIcBD6YJaNvczuhLtEQ',
            )
            .asString()}
          mapStyle={env
            .get('NEXT_PUBLIC_MAPBOX_STYLE_URL')
            .default('mapbox://styles/commonknowledge/ckqsa4g09145h17p84g69t7ns')
            .asString()}
          onViewportChange={setViewport}
          className="rounded-xl"
          ref={mapRef}
          viewportChangeMethod="flyTo"
        >
          <ActionSource data={data} />
          <CountryLayer
            countryFilter={countryFilter}
            countryCounts={countryCounts}
            onSelectCountry={(iso2id) =>
              iso2id ? onSelectCountry?.(iso2id) : onSelectCountry?.(null)
            }
          />
          {/* National events */}
          {displayStyle === 'detail' &&
            Object.entries(nationalActionsByCountryNoLocation).map(([isoA2, eventsUnlocated]) => {
              const clusterMarkerId = createIdFromActions(eventsUnlocated)
              if (
                !eventsUnlocated[0].coordinates?.longitude ||
                !eventsUnlocated[0].coordinates?.latitude
              ) {
                return null
              }
              return (
                <ClusterMarker
                  clusterMarkerId={clusterMarkerId}
                  key={clusterMarkerId}
                  longitude={eventsUnlocated[0].coordinates?.longitude}
                  latitude={eventsUnlocated[0].coordinates?.latitude}
                  events={eventsUnlocated}
                  label={
                    <Emoji
                      symbol={(eventsUnlocated[0].countries?.[0] as Country)?.emoji || ''}
                      label={(eventsUnlocated[0].countries?.[0] as Country)?.name}
                    />
                  }
                  isSelected={
                    !!(
                      eventsUnlocated.length > 0 &&
                      selectedPopupIds &&
                      selectedPopupIds.length > 0 &&
                      new Set(eventsUnlocated.map((e) => e.id)).difference(
                        new Set(selectedPopupIds),
                      ).size === 0
                    )
                  }
                  setSelectedPopupIds={setSelectedPopupIds}
                />
              )
            })}
          {/* Location-specific markers */}
          {displayStyle === 'detail' && (
            <Cluster
              ref={_cluster}
              radius={50}
              extent={512}
              nodeSize={64}
              component={(cluster: any) => {
                const events = _cluster.current?._cluster
                  .getLeaves(cluster.clusterId)
                  .map((p) => p.properties.props.data)
                const clusterMarkerId = createIdFromActions(events || [])

                return (
                  <ClusterMarker
                    clusterMarkerId={clusterMarkerId}
                    key={clusterMarkerId}
                    {...cluster}
                    events={events}
                    isSelected={
                      events &&
                      selectedPopupIds &&
                      new Set(events?.map((e) => e.id) || []).difference(
                        new Set(selectedPopupIds || []),
                      ).size === 0
                    }
                    setSelectedPopupIds={setSelectedPopupIds}
                  />
                )
              }}
            >
              {data
                .filter((d) => !!d.coordinates?.longitude && !!d.coordinates?.latitude)
                .map((d) => (
                  <MapMarker {...d.coordinates!} data={d} key={d.id} />
                ))}
            </Cluster>
          )}
        </ReactMapGL>
      </div>
    </ViewportContext.Provider>
  )

  return el
}

function ActionSource({ data }: { data: Event[] }) {
  return (
    <Source
      id="events"
      type="geojson"
      data={{
        type: 'FeatureCollection',
        features: data.map((d) => {
          const coords = getCoordinatesForAction(d)
          return {
            type: 'Feature',
            id: d.id,
            properties: d,
            geometry: {
              type: 'Point',
              coordinates: [coords.longitude, coords.latitude],
            },
          }
        }),
      }}
    />
  )
}

type CountryCounts = { [iso2: string]: number }

const BACKGROUND_LAYER_IDS = [
  'land',
  'landcover',
  'national-park',
  'landuse',
  'land-structure-polygon',
  'land-structure-line',
  'building-outline',
  'building',
  'undisputed country boundary fill hoverable',
]

const CountryLayer = ({
  countryCounts,
  countryFilter,
  onSelectCountry,
}: {
  countryCounts: CountryCounts
  countryFilter?: string | null
  onSelectCountry: (iso2id: string | null) => void
}) => {
  // const [event, setEvent] = useState<{ lng: number; lat: number }>()
  // const [hoverCountry, setHoverCountry] = useState<{
  //   color_group: number
  //   disputed: string
  //   iso_3166_1: string
  //   iso_3166_1_alpha_3: string
  //   name: string
  //   name_en: string
  //   region: string
  //   subregion: string
  //   wikidata_id: string
  //   worldview: string
  // }>()
  const map = useContext(MapContext) as MapboxMap

  return (
    <>
      <Source
        id="country-boundaries"
        {...{
          type: 'vector',
          url: 'mapbox://mapbox.country-boundaries-v1',
        }}
      />
      {BACKGROUND_LAYER_IDS.map((layer) => (
        <Layer
          key={layer}
          {...{
            id: layer,
            source: 'mapbox',
            'source-layer': layer,
            type: 'fill',
            paint: {
              'fill-color': getCSSVariable(`--color-gray-200`, true),
            },
          }}
        />
      ))}
      <Layer
        before="settlement-subdivision-label"
        {...{
          id: 'undisputed country boundary fill',
          source: 'country-boundaries',
          'source-layer': 'country_boundaries',
          type: 'fill',
          filter: ['==', ['get', 'disputed'], 'false'],
          paint: {
            'fill-color': [
              'coalesce',
              ['get', ['get', 'iso_3166_1'], ['literal', countryCounts]],
              'transparent',
            ],
          },
        }}
      />
      <Layer
        onClick={(event: MapMouseEvent) => {
          const country = event.features?.[0]?.properties
          if (country?.iso_3166_1) {
            if (country.iso_3166_1 === countryFilter) {
              // setEvent(undefined)
              // setHoverCountry(undefined)
              onSelectCountry(null)
            } else if (
              Object.keys(countryCounts).includes(country.iso_3166_1) &&
              event.features?.[0]?.properties
            ) {
              onSelectCountry(country.iso_3166_1)
            }
          }
        }}
        onHover={(event: MapMouseEvent) => {
          const country = event.features?.[0]?.properties
          if (country && Object.keys(countryCounts).includes(country.iso_3166_1)) {
            map.getCanvas().style.cursor = 'pointer'
          }
        }}
        onLeave={(event: MapMouseEvent) => {
          map.getCanvas().style.cursor = ''
        }}
        {...{
          id: 'undisputed country boundary fill hoverable',
          source: 'country-boundaries',
          'source-layer': 'country_boundaries',
          type: 'fill',
          filter: ['==', ['get', 'disputed'], 'false'],
          paint: {
            'fill-color': 'rgba(0,0,0,0)',
          },
        }}
      />
    </>
  )
}

function getCoordinatesForAction(data: Event) {
  let geoData = {
    latitude: (data.countries?.[0] as Country)?.coordinates?.latitude,
    longitude: (data.countries?.[0] as Country)?.coordinates?.longitude,
  }
  if (data?.coordinates?.longitude && data?.coordinates?.latitude) {
    geoData = {
      latitude: data.coordinates.latitude,
      longitude: data.coordinates.longitude,
    }
  }
  return geoData
}

const MapMarker = ({ data, ...coords }: { data: Event; latitude: number; longitude: number }) => {
  const router = useRouter()

  return (
    <Marker {...coords}>
      <div
        onMouseEnter={(e) => {
          e.preventDefault()
          e.stopPropagation()
          router.prefetch(data.path!)
        }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          router.push(
            data.path!,
            // , undefined, { shallow: false, scroll: false }
          )
        }}
        className="cursor-default transition duration-250 text-xs bg-white hover:bg-snot-200! text-black capitalize font-bold tracking-tight px-1 rounded-xl"
      >
        <div className="space-x-1 text-center">
          {!!data.categories?.length && (
            <span className="text-sm pr-1">
              <Emoji symbol={(data.categories?.[0] as Category)?.emoji || ''} />
            </span>
          )}
          {format(new Date(data.date), "MMM ''yy")}
        </div>
      </div>
    </Marker>
  )
}

const ClusterMarker = ({
  longitude,
  latitude,
  events,
  label,
  isSelected,
  setSelectedPopupIds,
  clusterMarkerId,
}: {
  clusterMarkerId: string
  longitude: number
  latitude: number
  events: Event[]
  label?: any
  isSelected: boolean
  setSelectedPopupIds: (value: string[] | null) => void
}) => {
  const router = useRouter()

  const marker = useRef<Marker>(null)

  useEffect(() => {
    if (marker.current?.getMarker()?._element) {
      if (isSelected) {
        ;(marker.current?.getMarker()?._element as HTMLDivElement).classList.add('z-30')
      } else {
        ;(marker.current?.getMarker()?._element as HTMLDivElement).classList.remove('z-30')
      }
    }
  }, [isSelected])

  return (
    <Marker
      ref={marker}
      longitude={longitude}
      latitude={latitude}
      anchor="bottom"
      // className={isSelected ? 'z-30' : 'z-10'}
    >
      <div className="relative">
        <div
          className={twMerge(
            'text-center items-center inline-flex flex-row transition duration-250 bg-gwYellow text-black hover:bg-snot-200! cursor-default! font-bold tracking-tight px-1 rounded-xl leading-none',
            isSelected ? 'bg-snot-200' : 'bg-white',
          )}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (isSelected) {
              setSelectedPopupIds(null)
            } else {
              setSelectedPopupIds(Array.from(new Set(events.map((e) => e.id))))
            }
          }}
        >
          <span className="text-sm align-middle pr-1 leading-none">
            {label ||
              events
                .reduce((categories, event) => {
                  return Array.from(
                    new Set(
                      categories.concat(
                        event.categories?.map((category) => (category as Category).emoji || '') ||
                          [],
                      ),
                    ),
                  )
                }, [] as string[])
                .map((emoji) => <Emoji symbol={emoji} key={emoji} className="leading-none" />)}
          </span>
          <span className="align-middle text-sm">{events.length}</span>
        </div>
      </div>
    </Marker>
  )
}
