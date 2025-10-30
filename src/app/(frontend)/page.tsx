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
  // Include both published and legacy records (where _status is null)
  const actionsResult = await payload.find({
    collection: 'solidarityActions',
    where: {
      or: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          _status: {
            equals: null,
          },
        },
      ],
    },
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
      <div className="homepage-hero">
        <h1>Game Worker Solidarity</h1>
        <p className="homepage-subtitle">
          Mapping and documenting collective movements by game workers striving to improve their
          working conditions.
        </p>
      </div>

      <div className="homepage-filters">
        <div className="filter-group">
          <span className="filter-label">Filter by</span>
          <select className="filter-select">
            <option>Country ▾</option>
          </select>
        </div>
        <div className="filter-group">
          <select className="filter-select">
            <option>Category ▾</option>
          </select>
        </div>
        <div className="filter-group">
          <select className="filter-select">
            <option>Company ▾</option>
          </select>
        </div>
        <div className="filter-group">
          <select className="filter-select">
            <option>Union ▾</option>
          </select>
        </div>
        <div className="filter-group">
          <select className="filter-select">
            <option>Select year</option>
          </select>
        </div>
      </div>

      <div className="homepage-actions-count">{sortedActions.length} actions</div>

      <div className="homepage-grid">
        <div className="map-section">
          <h2>Solidarity Action Density by Country</h2>
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
