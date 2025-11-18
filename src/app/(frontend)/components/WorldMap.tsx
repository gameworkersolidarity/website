'use client'

import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
// import coords from 'country-coords'
// import countryFlagEmoji from 'country-flag-emoji'
import countries from 'iso-3166-1-codes'
import { interpolateOrRd } from 'd3-scale-chromatic'
import { scaleSequential } from 'd3-scale'

const geoUrl = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'

interface CountryData {
  queue: number
  color: string
}

interface WorldMapProps {
  data: Record<string, CountryData>
}

export function WorldMap({ data }: WorldMapProps) {
  // Determine min and max queue values
  const queues = Object.values(data).map((c) => c.queue)
  const minQueue = Math.min(...queues, 0)
  const maxQueue = Math.max(...queues, 1)

  // Set up color scale (OrRd from d3-chromatic)
  const sequentialColor = scaleSequential(interpolateOrRd).domain([minQueue, maxQueue])

  const colorScale = (queue: number) => {
    if (queue === 0) return '#E5E5E5'
    // Normalize values to avoid pure white (OrRd[0]) for real data
    return sequentialColor(queue)
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ComposableMap
        projectionConfig={{
          scale: 120,
          center: [0, 20],
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const { alpha2 } = countries.byAlpha3().get(geo.id) || {}
              const countryData = data[alpha2 || 'XXX']
              const queue = countryData?.queue || 0

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={colorScale(queue).toString()}
                  stroke="#fff"
                  strokeWidth={0.5}
                  style={{
                    default: {
                      outline: 'none',
                    },
                    hover: {
                      fill: '#4A90E2',
                      outline: 'none',
                      cursor: 'pointer',
                    },
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
      <div style={{ marginTop: '20px', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>Solidarity Actions:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '15px', backgroundColor: '#E5E5E5' }} />
            <span style={{ fontSize: '12px' }}>0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '15px', backgroundColor: '#FEB24C' }} />
            <span style={{ fontSize: '12px' }}>1-4</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '15px', backgroundColor: '#FD8D3C' }} />
            <span style={{ fontSize: '12px' }}>5-14</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '15px', backgroundColor: '#E31A1C' }} />
            <span style={{ fontSize: '12px' }}>15-29</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '15px', backgroundColor: '#800026' }} />
            <span style={{ fontSize: '12px' }}>30+</span>
          </div>
        </div>
      </div>
    </div>
  )
}
