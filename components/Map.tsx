import { SolidarityAction } from '../data/types';
import { memo, useCallback, useState, useRef, createContext, useEffect, useContext } from 'react';
import ReactMapGL, { Layer, MapRef, Marker, Source } from '@urbica/react-map-gl';
import env from 'env-var';
// import { stringifyArray } from '../utils/string';
import Emoji from 'a11y-react-emoji';
import { Map as MapType } from 'mapbox-gl';
// import { interpolateTurbo } from 'd3-scale-chromatic';
import { only } from '../utils/screens';
import useSWR from 'swr';
import qs from 'query-string';
import { CountryData } from '../data/country';
import { SolidarityActionItem, SolidarityActionsList } from './SolidarityActions';;
import 'mapbox-gl/dist/mapbox-gl.css';
import { theme } from 'twin.macro';
import * as polished from 'polished'

const MapContext = createContext<MapRef | null>(null)

export function Map({ data, ...initialViewport }: { data: SolidarityAction[], width?: any, height?: any }) {
  const [viewport, setViewport] = useState({
    latitude: 15,
    longitude: 0,
    zoom: 0.7,
    // width: '100%',
    // height: 700,
    ...initialViewport,
  });

  const updateViewport = useCallback(nextViewport => setViewport(nextViewport), [])

  const ref = useRef<MapRef>(null)

  const [country, setCountry] = useState<string>()

  return (
    <div className='relative' style={{
      height: 850,
      maxHeight: '66vh',
      width: '100%'
    }}>
      <div
        className='p-1 hidden overflow-y-auto md:flex absolute top-0 left-0 items-stretch z-10 h-full pointer-events-none'
        style={{
          width: 400,
          maxWidth: '50vw',
        }}>
        {country && (
          <div>
            <CountryPanel iso2={country} />
            <div className='pointer-events-auto absolute top-4 right-4 text-sm uppercase font-bold link z-20' onClick={() => setCountry(undefined)}>Close</div>
          </div>
        )}
      </div>
      <ReactMapGL
        style={{
          // position: 'absolute',
          // top: 0,
          // left: 0,
          width: '100%',
          height: '100%'
        }}
        {...viewport}
        accessToken={env.get('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN').default('pk.eyJ1IjoiY29tbW9ua25vd2xlZGdlIiwiYSI6ImNrcHB2cnBoMDByNnUydm1uMm5qenB5bGoifQ.8ioYIcBD6YJaNvczuhLtEQ').asString()}
        mapStyle={env.get('NEXT_PUBLIC_MAPBOX_STYLE_URL').default('mapbox://styles/commonknowledge/ckpzergl604py17s2jrpjp8eu').asString()}
        onViewportChange={updateViewport}
        className="rounded-md"
        ref={ref}
      >
        <MapLayer data={data} onSelectCountry={newId => setCountry(oldId => newId)} />
      </ReactMapGL>
    </div>
  );
}

const MapLayer = memo(({ data, onSelectCountry }: {
  data: SolidarityAction[], onSelectCountry: (iso2: string) => void
}) => {
  const [hoverCountry, setHoverCountry] = useState<string>('XX')
  return (
    <>
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
      <Source id="country-boundaries" {...{
        "type": "vector",
        "url": "mapbox://mapbox.country-boundaries-v1"
      }} />
      {/* <Layer
        {...{
          "id": "undisputed country boundary line",
          "source": "country-boundaries",
          "source-layer": "country_boundaries",
          "type": "line",
          "filter": [
            "==",
            [
              "get",
              "disputed"
            ],
            "false"
          ],
          "paint": {
            "line-color": "rgba(66,100,251, 0.3)",
            // "line-outline-color": "#0000ff",
            "line-opacity": [
              'case',
              ['==', ['get', 'iso_3166_1'], hoverCountry],
              1,
              0.5
            ]
          }
        }}
      /> */}
      <Layer
        onClick={event => {
          const countryIso2 = event.features?.[0]?.properties?.iso_3166_1
          onSelectCountry(countryIso2)
        }}
        onHover={event => {
          const countryIso2 = event.features?.[0]?.properties?.iso_3166_1
          setHoverCountry(countryIso2)
        }}
        onLeave={event => {
          const countryIso2 = event.features?.[0]?.properties?.iso_3166_1
          setHoverCountry('XX')
        }}
        {...{
          "id": "undisputed country boundary fill",
          "source": "country-boundaries",
          "source-layer": "country_boundaries",
          "type": "fill",
          "filter": [
            "==",
            [
              "get",
              "disputed"
            ],
            "false"
          ],
          "paint": {
            "fill-color": [
              'case',
              ['==', ['get', 'iso_3166_1'], hoverCountry],
              polished.rgba((theme`colors.gwBlue`), 0.5),
              "rgba(66,100,251, 0)"
            ],
            "fill-outline-color": theme`colors.gwBlue`,
          }
        }}
      />
      <Layer
        id='heatmap'
        type='heatmap'
        source='actions'
        paint={{
          // Increase the heatmap weight based on frequency and property magnitude
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            0, 0,
            6, 1
          ],
          // Increase the heatmap color weight weight by zoom level
          // heatmap-intensity is a multiplier on top of heatmap-weight
          // 'heatmap-intensity': [
          //   'interpolate',
          //   ['linear'],
          //   ['zoom'],
          //   0, 1,
          //   9, 2
          // ],
          // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
          // Begin color ramp at 0-stop with a 0-transparancy color
          // to create a blur-like effect.
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, polished.rgba(255, 255, 255, 0),
            0.1, polished.rgba(255, 255, 255, 0.5),
            // 0.175, rgba(255, 255, 255, 0.5),
            0.2, polished.rgba(theme`colors.gwBlueLight`, 0.5),
            // 0.2,'rgba(47, 157, 245, 1)',
            // 0.4,'rgba(77, 248, 132, 1)',
            0.3, polished.rgba(theme`colors.gwBlue`, 1),
            // 0.6,'rgba(222, 221, 50, 1)',
            0.4, polished.rgba(theme`colors.gwPink`, 1),
            // 0.8,'rgba(246, 95, 24, 1)',
            0.8, polished.rgba(theme`colors.gwOrangeLight`, 1),
            1, polished.rgba(theme`colors.gwOrange`, 1),
            //  0,'rgba(35, 23, 27, 0)',
            //  0.2,'rgba(47, 157, 245, 1)',
            //  0.4,'rgba(77, 248, 132, 1)',
            //  0.6,'rgba(222, 221, 50, 1)',
            //  0.8,'rgba(246, 95, 24, 1)',
            //  1,'rgba(144, 12, 0, 1)',
            // ...[
            // 0,
            // 0.2,
            // 0.4,
            // 0.6,
            // 0.8,
            // 1,
            // ].reduce((ar, n) => {
            //   console.log(interpolateTurbo(n))
            //   return [...ar,
            //     n, interpolateTurbo(n)
            //   ]
            // }, [])
          ],
          // Adjust the heatmap radius by zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 75,
            9, 20
          ],
          // Transition from heatmap to circle layer by zoom level
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            8, 0
          ]
        }}
      />
      {data.map(d => (
        <MapMarker key={d.id} data={d} />
      ))}
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
  return (
    <Marker {...getCoordinatesForAction(data)}>
      <div className='text-xs space-x-1 text-center transform'>
        <Emoji symbol='💥' />
        <br />
        {/* <div className='inline capitalize-first'>{stringifyArray(data.fields.Category)}</div> */}
        <div className='bg-gray-800 text-white inline capitalize font-bold tracking-tight  px-1 rounded-md pointer-events-none'>
          {data.geography.location?.display_name?.split(',')?.[0] || data.fields['Country Name']}
        </div>
      </div>
    </Marker>
  )
})

const CountryPanel = memo(({ iso2 }: { iso2: string }) => {
  const data = useSWR<CountryData>(qs.stringifyUrl({
    url: '/api/countryData',
    query: { iso2 }
  }), { 
    revalidateOnMount: true
  })

  const country = data?.data?.country

  return (
    <div className='pointer-events-auto rounded-md p-3 space-y-4 flex flex-col bg-gray-100 w-full'>
      {!country ? <div>Loading {iso2}</div> : <>
        <h2 className=' font-bold text-2xl max-w-xl'>
          {country?.fields['Name'].trim()} <Emoji symbol={country.emoji.emoji} label='flag' />
        </h2>
        <div className='my-4'>
          {country.fields.Summary &&<div className='prose' dangerouslySetInnerHTML={{ __html: country.summary.html }} />}
        </div>
        <div className='overflow-y-auto'>
          <SolidarityActionsList
            mini
            data={country.solidarityActions || []}
            withDialog
            gridStyle=''
            dialogProps={{
              key: "MapPopup"
            }}
          />
        </div>
      </>}
    </div>
  )
})