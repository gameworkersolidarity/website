'use client'

import Link from 'next/link'
import type { SolidarityAction, Country, Category } from '@/payload-types'

interface Redundancy {
  id: number
  studio: string
  date: string
  headcount?: number | null
  parent?: string | null
  type?: string | null
  studioLocation?: string | null
  parentLocation?: string | null
}

interface UnifiedTimelineProps {
  actions: SolidarityAction[]
  redundancies: Redundancy[]
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

interface TimelineEvent {
  id: string
  date: Date
  type: 'action' | 'redundancy'
  data: SolidarityAction | Redundancy
}

export function UnifiedTimeline({ actions, redundancies }: UnifiedTimelineProps) {
  // Combine and sort all events by date
  const events: TimelineEvent[] = [
    ...actions.map((action) => ({
      id: `action-${action.id}`,
      date: new Date(action.Date),
      type: 'action' as const,
      data: action,
    })),
    ...redundancies.map((redundancy) => ({
      id: `redundancy-${redundancy.id}`,
      date: new Date(redundancy.date),
      type: 'redundancy' as const,
      data: redundancy,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  // Group events by year
  const eventsByYear = events.reduce(
    (acc, event) => {
      const year = event.date.getFullYear()
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(event)
      return acc
    },
    {} as Record<number, TimelineEvent[]>,
  )

  // Sort years in descending order
  const years = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => b - a)

  if (events.length === 0) {
    return null
  }

  return (
    <div
      style={{
        position: 'relative',
        padding: '2rem 0',
      }}
      className="unified-timeline"
    >
      {/* Vertical timeline line */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '2px',
          background: 'linear-gradient(to bottom, #4A90E2, #d32f2f)',
          transform: 'translateX(-50%)',
          zIndex: 0,
        }}
        className="timeline-line"
      />

      {years.map((year, yearIndex) => {
        const yearEvents = eventsByYear[year]
        const isLastYear = yearIndex === years.length - 1

        return (
          <div
            key={year}
            style={{ position: 'relative', marginBottom: isLastYear ? 0 : '3rem' }}
            className="timeline-year-group"
          >
            {/* Year label on timeline */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                transform: 'translateX(-50%)',
                background: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '2px solid #4A90E2',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                color: '#333',
                zIndex: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              className="timeline-year-label"
            >
              {year}
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {yearEvents.map((event, eventIndex) => {
                const isAction = event.type === 'action'
                const isLast = eventIndex === yearEvents.length - 1

                return (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      position: 'relative',
                      marginBottom: isLast ? 0 : '2rem',
                    }}
                    className="timeline-event-row"
                  >
                    {/* Timeline dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '1.5rem',
                        transform: 'translateX(-50%)',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: isAction ? '#4A90E2' : '#d32f2f',
                        border: '3px solid white',
                        boxShadow: '0 0 0 2px ' + (isAction ? '#4A90E2' : '#d32f2f'),
                        zIndex: 1,
                      }}
                      className="timeline-dot"
                    />

                    {/* For actions: content on left, spacer, empty on right */}
                    {/* For redundancies: empty on left, spacer, content on right */}
                    {isAction ? (
                      <>
                        {/* Content - left side for actions */}
                        <div
                          style={{
                            flex: 1,
                            padding: '0 2rem 0 0',
                            textAlign: 'right',
                          }}
                          className="timeline-content"
                        >
                          <ActionItem action={event.data as SolidarityAction} />
                        </div>

                        {/* Spacer for center timeline */}
                        <div style={{ width: '100px', flexShrink: 0 }} className="timeline-spacer" />

                        {/* Empty space on right side */}
                        <div style={{ flex: 1 }} className="timeline-empty" />
                      </>
                    ) : (
                      <>
                        {/* Empty space on left side */}
                        <div style={{ flex: 1 }} className="timeline-empty" />

                        {/* Spacer for center timeline */}
                        <div style={{ width: '100px', flexShrink: 0 }} className="timeline-spacer" />

                        {/* Content - right side for redundancies */}
                        <div
                          style={{
                            flex: 1,
                            padding: '0 0 0 2rem',
                            textAlign: 'left',
                          }}
                          className="timeline-content"
                        >
                          <RedundancyItem redundancy={event.data as Redundancy} />
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ActionItem({ action }: { action: SolidarityAction }) {
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
    <div
      style={{
        background: '#f9f9f9',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        borderLeft: '3px solid #4A90E2',
        textAlign: 'right',
      }}
    >
      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
        {formattedDate}
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        {action.Location && (
          <span style={{ fontSize: '0.9rem', color: '#666', marginRight: '0.5rem' }}>
            {action.Location}
          </span>
        )}
        {countries.map((country, idx) => (
          <span key={idx} style={{ fontSize: '0.9rem', color: '#666', marginRight: '0.5rem' }}>
            {country.countryCode && getCountryFlag(country.countryCode)}
            {country.Name && ` ${country.Name}`}
          </span>
        ))}
        {categories.map((category, idx) => (
          <span key={idx} style={{ fontSize: '0.9rem', color: '#666', marginRight: '0.5rem' }}>
            {category.Emoji || '📌'}
            {category.Name && ` ${category.Name}`}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
        {action.slug ? (
          <Link
            href={`/actions/${action.slug}`}
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#4A90E2',
              textDecoration: 'none',
            }}
          >
            {action.Name}
          </Link>
        ) : (
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#333',
            }}
          >
            {action.Name}
          </span>
        )}
        {action.Link && (
          <a
            href={action.Link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '14px', textDecoration: 'none' }}
          >
            🔗
          </a>
        )}
      </div>
    </div>
  )
}

function RedundancyItem({ redundancy }: { redundancy: Redundancy }) {
  const date = new Date(redundancy.date)
  const formattedDate = formatDate(date)

  return (
    <div
      style={{
        background: '#f9f9f9',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        borderRight: '3px solid #d32f2f',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span
          style={{
            background: '#d32f2f',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Redundancy
        </span>
        <span style={{ fontSize: '0.85rem', color: '#666' }}>{formattedDate}</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.5rem',
        }}
      >
        <Link
          href={`/redundancies/${redundancy.id}`}
          style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#d32f2f',
            textDecoration: 'none',
          }}
        >
          {redundancy.studio}
        </Link>
        {redundancy.type && (
          <span
            style={{
              background: '#e0e0e0',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              color: '#666',
            }}
          >
            {redundancy.type}
          </span>
        )}
      </div>
      {redundancy.headcount && (
        <div
          style={{
            color: '#d32f2f',
            fontWeight: 500,
            marginBottom: '0.25rem',
          }}
        >
          {redundancy.headcount.toLocaleString()} people affected
        </div>
      )}
      {redundancy.studioLocation && (
        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
          Location: {redundancy.studioLocation}
        </div>
      )}
      {redundancy.parent && (
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          Parent: {redundancy.parent}
          {redundancy.parentLocation && ` (${redundancy.parentLocation})`}
        </div>
      )}
    </div>
  )
}

