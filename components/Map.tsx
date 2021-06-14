import { SolidarityAction } from '../data/types';
import { memo, useState } from 'react';
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
    height: 350,
    ...initialViewport,
  });

  return (
    <ReactMapGL
      {...viewport}
      mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      mapStyle="mapbox://styles/commonknowledge/ckptscib5346h19purz84rb2o"
      onViewportChange={nextViewport => setViewport(nextViewport)}
      className="rounded-md"
    >
      {data.map(d => (
        <MapMarker key={d.id} data={d} />
      ))}
    </ReactMapGL>
  );
}

const MapMarker = memo(({ data }: { data: SolidarityAction }) => {
  let geoData = {
    latitude: data?.geography.country[0].latitude,
    longitude: data?.geography.country[0].longitude
  }
  if (data?.geography.city) {
    geoData = {
      latitude: data?.geography.city.loc.coordinates[1],
      longitude: data?.geography.city.loc.coordinates[0],
    }
  }

  return (
    <Marker {...geoData}>
      <div className='text-xs space-x-1 text-center transform -translate-x-1/2'>
        <Emoji symbol='💥' />
        {/* <div className='inline capitalize-first'>{stringifyArray(data.fields.Category)}</div> */}
        <div className='inline capitalize'>{data?.geography?.city?.name || data.fields['Country Name']}</div>
      </div>
    </Marker>
  )
})