'use client'

import Link from 'next/link'
import React from 'react'
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
          <div className="year-header-row">
            <h2 className="year-header" id={year.toString()}>
              {year}
            </h2>
            <div className="year-action-count">
              {actionsByYear[year].length} action{actionsByYear[year].length !== 1 ? 's' : ''}
            </div>
          </div>
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

              // Extract domain from link
              const linkDomain = action.Link
                ? (() => {
                    try {
                      return new URL(action.Link).hostname.replace('www.', '')
                    } catch {
                      return action.Link
                    }
                  })()
                : null

              const cardContent = (
                <>
                  {/* Metadata line */}
                  <div className="timeline-action-metadata">
                    <time dateTime={action.Date} className="timeline-action-date">
                      {formattedDate}
                    </time>
                    {action.Location && (
                      <span className="timeline-action-location">{action.Location}</span>
                    )}
                    {countries.map((country, idx) => (
                      <span key={idx} className="timeline-action-metadata-item">
                        {country.countryCode && (
                          <span
                            className="timeline-action-flag"
                            aria-label={`Flag of ${country.Name}`}
                          >
                            {getCountryFlag(country.countryCode)}
                          </span>
                        )}
                        <span>{country.Name}</span>
                      </span>
                    ))}
                    {categories.map((category, idx) => (
                      <span key={idx} className="timeline-action-metadata-item capitalize">
                        {category.Emoji && <span>{category.Emoji}</span>}
                        <span> {category.Name}</span>
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h3 className="timeline-action-title">{action.Name}</h3>

                  {/* External link */}
                  {action.Link && (
                    <div className="timeline-action-link">
                      <a
                        href={action.Link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="timeline-action-external-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span aria-label="Link" role="img">
                          🔗
                        </span>{' '}
                        <span className="timeline-action-link-domain">{linkDomain}</span>
                      </a>
                    </div>
                  )}
                </>
              )

              return action.slug ? (
                <Link
                  key={action.id}
                  href={`/actions/${action.slug}`}
                  className="timeline-action-card-link"
                >
                  <article className="timeline-action-card">{cardContent}</article>
                </Link>
              ) : (
                <article key={action.id} className="timeline-action-card">
                  {cardContent}
                </article>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
