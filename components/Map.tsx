import { SolidarityAction } from '../data/types';
import { useState } from 'react';
import ReactMapGL, { Marker } from 'react-map-gl';
import env from 'env-var';
import { stringifyArray } from '../utils/string';
import Emoji from 'a11y-react-emoji';

export function Map({ data, ...initialViewport }: { data: SolidarityAction[], width?: any, height?: any }) {
  const [viewport, setViewport] = useState({
    latitude: 37.7577,
    longitude: -122.4376,
    zoom: 1,
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
        <Marker
          key={d.id}
          latitude={d.geography.country.latitude} 
          longitude={d.geography.country.longitude}
        >
          <div>
            <Emoji symbol='💥' />
            <span>{stringifyArray(d.fields.Category)}</span>
          </div>
        </Marker>
      ))}
    </ReactMapGL>
  );
}