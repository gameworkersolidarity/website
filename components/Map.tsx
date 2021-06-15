import { SolidarityAction } from '../data/types';
import { memo, useCallback, useState } from 'react';
import ReactMapGL, { Marker } from 'react-map-gl';
import env from 'env-var';
import { stringifyArray } from '../utils/string';
import Emoji from 'a11y-react-emoji';

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
      {data.map(d => (
        <MapMarker key={d.id} data={d} />
      ))}
    </>
  )
})

const MapMarker = memo(({ data }: { data: SolidarityAction }) => {
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

  return (
    <Marker {...geoData}>
      <div className='text-xs space-x-1 text-center transform -translate-x-1/2'>
        <Emoji symbol='💥' />
        <br />
        {/* <div className='inline capitalize-first'>{stringifyArray(data.fields.Category)}</div> */}
        <div className='inline capitalize'>
          {data.geography.location?.display_name?.split(',')?.[0] || data.fields['Country Name']}
        </div>
      </div>
    </Marker>
  )
})