'use client'

import type { SolidarityAction } from '@/payload-types'

interface ActionsTimelineProps {
  actions: SolidarityAction[]
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
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '30px', fontSize: '32px', fontWeight: 'bold' }}>
        Timeline of Solidarity Actions
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {years.map((year) => (
          <div key={year}>
            <h3
              style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '15px',
                color: '#4A90E2',
              }}
            >
              {year} ({actionsByYear[year].length} action
              {actionsByYear[year].length !== 1 ? 's' : ''})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {actionsByYear[year].map((action) => {
                const date = new Date(action.Date)
                const formattedDate = date.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <div
                    key={action.id}
                    style={{
                      padding: '15px',
                      borderLeft: '3px solid #4A90E2',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '10px',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                        {formattedDate}
                      </span>
                      {action.Location && (
                        <span style={{ fontSize: '14px', color: '#888' }}>• {action.Location}</span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>
                      {action.Name}
                    </h4>
                    {action.Link && (
                      <a
                        href={action.Link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '14px', color: '#4A90E2', textDecoration: 'none' }}
                      >
                        Learn more →
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
