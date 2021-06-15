import { SolidarityAction } from '../data/types';
import { memo, useCallback, useState } from 'react';
import ReactMapGL, { Layer, Marker, Source } from 'react-map-gl';
import env from 'env-var';
// import { stringifyArray } from '../utils/string';
import Emoji from 'a11y-react-emoji';
// import { interpolateTurbo } from 'd3-scale-chromatic';

export function Map({ data, ...initialViewport }: { data: SolidarityAction[], width?: any, height?: any }) {
  const [viewport, setViewport] = useState({
    latitude: 15,
    longitude: 0,
    zoom: 0.7,
    width: '100%',
    height: 700,
    ...initialViewport,
  });

  const updateViewport = useCallback(nextViewport => setViewport(nextViewport), [])

  return (
    <ReactMapGL
      {...viewport}
      mapboxApiAccessToken={env.get('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN').default('pk.eyJ1IjoiY29tbW9ua25vd2xlZGdlIiwiYSI6ImNrcHB2cnBoMDByNnUydm1uMm5qenB5bGoifQ.8ioYIcBD6YJaNvczuhLtEQ').asString()}
      mapStyle={env.get('NEXT_PUBLIC_MAPBOX_STYLE_URL').default('mapbox://styles/commonknowledge/ckptscib5346h19purz84rb2o').asString()}
      onViewportChange={updateViewport}
      className="rounded-md"
    >
      <MapLayer data={data} />
    </ReactMapGL>
  );
}

const MapLayer = memo(({ data }: { data: SolidarityAction[] }) => {
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
             0,'rgba(35, 23, 27, 0)',
             0.2,'rgba(47, 157, 245, 1)',
             0.4,'rgba(77, 248, 132, 1)',
             0.6,'rgba(222, 221, 50, 1)',
             0.8,'rgba(246, 95, 24, 1)',
             1,'rgba(144, 12, 0, 1)',
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
      <div className='text-xs space-x-1 text-center transform -translate-x-1/2'>
        <Emoji symbol='💥' />
        <br />
        {/* <div className='inline capitalize-first'>{stringifyArray(data.fields.Category)}</div> */}
        <div className='inline capitalize font-bold tracking-tight bg-gray-900 text-gray-200 px-1 rounded-md pointer-events-none'>
          {data.geography.location?.display_name?.split(',')?.[0] || data.fields['Country Name']}
        </div>
      </div>
    </Marker>
  )
})