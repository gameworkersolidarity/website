'use client'

import Link from 'next/link'
import React from 'react'
import type { Event } from '@/payload-types'

interface EventTimelineProps {
  events: Event[]
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

export function EventTimeline({ events }: EventTimelineProps) {
  // Group events by year
  const eventsByYear = events.reduce(
    (acc, event) => {
      const year = new Date(event.date).getFullYear()
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(event)
      return acc
    },
    {} as Record<number, Event[]>,
  )

  // Sort years in descending order
  const years = Object.keys(eventsByYear)
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
              {eventsByYear[year].length} event{eventsByYear[year].length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="actions-list">
            {eventsByYear[year].map((event) => {
              const date = new Date(event.date)
              const formattedDate = formatDate(date)

              const cardContent = (
                <>
                  {/* Metadata line */}
                  <div className="timeline-action-metadata">
                    <time dateTime={event.date} className="timeline-action-date">
                      {formattedDate}
                    </time>
                    {event.location && (
                      <span className="timeline-action-location">{event.location}</span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="timeline-action-title">{event.title}</h3>
                </>
              )

              return event.slug ? (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="timeline-action-card-link"
                >
                  <article className="timeline-action-card">{cardContent}</article>
                </Link>
              ) : (
                <article key={event.id} className="timeline-action-card">
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

