'use client'

import Link from 'next/link'
import type { SolidarityAction, Country, Category } from '@/payload-types'

interface ActionsTimelineProps {
  actions: SolidarityAction[]
}

// Helper function to get country flag emoji from country code
function getCountryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// Helper function to format date like "02 Jun 2025"
function formatDate(date: Date): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const day = date.getDate().toString().padStart(2, '0')
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

// Type guard for Country
function isCountry(obj: number | Country): obj is Country {
  return typeof obj === 'object' && obj !== null && 'countryCode' in obj
}

// Type guard for Category
function isCategory(obj: number | Category): obj is Category {
  return typeof obj === 'object' && obj !== null && 'Name' in obj
}

export function ActionsTimeline({ actions }: ActionsTimelineProps) {
  // Group actions by year
  const actionsByYear = actions.reduce(
    (acc, action) => {
      const year = new Date(action.Date).getFullYear()
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(action)
      return acc
    },
    {} as Record<number, SolidarityAction[]>,
  )

  // Sort years in descending order
  const years = Object.keys(actionsByYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div>
      {years.map((year) => (
        <div key={year} className="year-group">
          <h2 className="year-header">{year}</h2>
          <div className="actions-list">
            {actionsByYear[year].map((action) => {
              const date = new Date(action.Date)
              const formattedDate = formatDate(date)

              // Get country flags
              const countries = Array.isArray(action.Country)
                ? action.Country.filter(isCountry)
                : []

              // Get categories with emojis
              const categories = Array.isArray(action.Category)
                ? action.Category.filter(isCategory)
                : []

              return (
                <div key={action.id} className="action-item">
                  <div className="action-date">{formattedDate}</div>
                  <div className="action-content">
                    <div className="action-meta">
                      {action.Location && (
                        <span className="action-location">{action.Location}</span>
                      )}
                      {countries.map((country, idx) => (
                        <span key={idx} className="action-country">
                          {country.countryCode && getCountryFlag(country.countryCode)}
                          {country.Name && ` ${country.Name}`}
                        </span>
                      ))}
                      {categories.map((category, idx) => (
                        <span key={idx} className="action-category">
                          {category.Emoji || '📌'}
                          {category.Name && ` ${category.Name}`}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {action.slug ? (
                        <Link href={`/actions/${action.slug}`} className="action-title">
                          {action.Name}
                        </Link>
                      ) : (
                        <span
                          className="action-title"
                          style={{ textDecoration: 'none', cursor: 'default' }}
                        >
                          {action.Name}
                        </span>
                      )}
                      {action.Link && (
                        <a
                          href={action.Link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-link"
                          style={{ fontSize: '14px', textDecoration: 'none' }}
                        >
                          🔗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
