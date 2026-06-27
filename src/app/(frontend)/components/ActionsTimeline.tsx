'use client'

import Link from 'next/link'
import React from 'react'
import type { Action, Country, Category } from '@/payload-types'
import Emoji from 'a11y-react-emoji'

interface ActionsTimelineProps {
  actions: Action[]
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
function isCountry(obj: Country['id'] | Country): obj is Country {
  return typeof obj === 'object' && obj !== null && 'isoA2' in obj
}

// Type guard for Category
function isCategory(obj: Category['id'] | Category): obj is Category {
  return typeof obj === 'object' && obj !== null && 'Name' in obj
}

export function ActionsTimeline({ actions }: ActionsTimelineProps) {
  // Group actions by year
  const actionsByYear = actions.reduce(
    (acc, action) => {
      const year = new Date(action.date).getFullYear()
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(action)
      return acc
    },
    {} as Record<number, Action[]>,
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
              const date = new Date(action.date)
              const formattedDate = formatDate(date)

              // Get country flags
              const countries = Array.isArray(action.countries)
                ? action.countries.filter(isCountry)
                : []

              // Get categories with emojis
              const categories = Array.isArray(action.categories)
                ? action.categories.filter(isCategory)
                : []

              const cardContent = (
                <>
                  {/* Metadata line */}
                  <div className="timeline-action-metadata">
                    <time dateTime={action.date} className="timeline-action-date">
                      {formattedDate}
                    </time>
                    {action.location && (
                      <span className="timeline-action-location">{action.location}</span>
                    )}
                    {countries.map((country, idx) => (
                      <span key={country.id} className="timeline-action-metadata-item">
                        <Emoji symbol={country.emoji || ''} label={`Flag of ${country.name}`} />
                        <span>{country.name}</span>
                      </span>
                    ))}
                    {categories.map((category, idx) => (
                      <span key={idx} className="timeline-action-metadata-item capitalize">
                        {category.emoji && <span>{category.emoji}</span>}
                        <span> {category.name}</span>
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h3 className="timeline-action-title">{action.name}</h3>
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
