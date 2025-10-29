import { getPayload } from 'payload'
import React from 'react'

import { WorldMap } from './components/WorldMap'
import { ActionsTimeline } from './components/ActionsTimeline'
import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch all solidarity actions with country data
  const actionsResult = await payload.find({
    collection: 'solidarityActions',
    // where: {
    //   Public: {
    //     equals: true,
    //   },
    // },
    depth: 2, // Include country data
    pagination: false,
  })

  // Fetch all countries
  const countriesResult = await payload.find({
    collection: 'countries',
  })

  // Create a map of country codes to action counts
  const countryActionCounts: Record<string, number> = {}

  // Count actions per country
  actionsResult.docs.forEach((action) => {
    if (action.Country && Array.isArray(action.Country)) {
      action.Country.forEach((country) => {
        if (typeof country === 'object' && country.countryCode) {
          const code = country.countryCode
          countryActionCounts[code] = (countryActionCounts[code] || 0) + 1
        }
      })
    }
  })

  // Calculate color intensity based on action count
  const countryDataMap: Record<string, { queue: number; color: string }> = {}
  Object.entries(countryActionCounts).forEach(([code, count]) => {
    countryDataMap[code] = {
      queue: count,
      color: '', // Not used currently, but kept for future enhancements
    }
  })

  // Sort actions by date (most recent first)
  const sortedActions = [...actionsResult.docs].sort(
    (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime(),
  )

  return (
    <div className="homepage">
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>
        Game Workers Solidarity Platform
      </h1>
      <div className="homepage-grid">
        <div className="map-section">
          <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
            Solidarity Action Density by Country
          </h2>
          <div className="map-container">
            <WorldMap data={countryDataMap} />
          </div>
        </div>
        <div className="timeline-section">
          <ActionsTimeline actions={sortedActions} />
        </div>
      </div>
    </div>
  )
}
