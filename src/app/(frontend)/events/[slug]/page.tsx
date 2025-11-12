import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import Link from 'next/link'
import { EventTimeline } from '../../components/EventTimeline'
import type { Event } from '@/payload-types'

type Props = {
  params: Promise<{ slug: string }>
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

// Type guard for Event
function isEvent(obj: number | Event): obj is Event {
  return typeof obj === 'object' && obj !== null && 'title' in obj
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const event = await payload
    .find({
      collection: 'events',
      depth: 2, // Include related data (related events, etc.)
      draft: isDraftMode,
      limit: 1,
      where: {
        slug: {
          equals: slug,
        },
        // Only fetch published content when not in draft mode
        ...(!isDraftMode
          ? {
              _status: {
                equals: 'published',
              },
            }
          : {}),
      },
    })
    .then(({ docs }) => docs?.[0])

  if (!event) {
    notFound()
  }

  // Extract related events
  const relatedEvents: Event[] = []
  if (event.relatedEvents && Array.isArray(event.relatedEvents)) {
    for (const relatedEventItem of event.relatedEvents) {
      if (relatedEventItem?.relatedEvent) {
        // Check if the related event is already populated (object) or just an ID
        if (typeof relatedEventItem.relatedEvent === 'object' && isEvent(relatedEventItem.relatedEvent)) {
          // Already populated, use it directly if it's published (when not in draft mode)
          if (isDraftMode || relatedEventItem.relatedEvent._status === 'published') {
            relatedEvents.push(relatedEventItem.relatedEvent)
          }
        } else {
          // Not populated, fetch it
          const relatedEventId = relatedEventItem.relatedEvent
          try {
            const relatedEventDoc = await payload.findByID({
              collection: 'events',
              id: relatedEventId,
              depth: 1,
              draft: isDraftMode,
            })

            // Only include if it's published (when not in draft mode) or if it exists
            if (
              relatedEventDoc &&
              isEvent(relatedEventDoc) &&
              (isDraftMode || relatedEventDoc._status === 'published')
            ) {
              relatedEvents.push(relatedEventDoc)
            }
          } catch (error) {
            // Event not found or not accessible, skip it
            console.error(`Failed to fetch related event ${relatedEventId}:`, error)
          }
        }
      }
    }
  }

  const formattedDate = event.date ? formatDate(new Date(event.date)) : ''

  return (
    <div className="action-page">
      <article className="action-article">
        {/* Metadata line */}
        <div className="action-metadata">
          {formattedDate && (
            <time dateTime={event.date} className="action-date">
              {formattedDate}
            </time>
          )}
          {event.location && (
            <span className="action-metadata-item">{event.location}</span>
          )}
        </div>

        {/* Article title */}
        <h1 className="action-title font-identity">{event.title}</h1>

        {/* Article content */}
        {event.description && (
          <div className="action-content">
            <LexicalRenderer content={event.description} />
          </div>
        )}

        {/* Have more info section */}
        <div className="action-more-info">
          <span>Have more info about this event? </span>
          <a href="mailto:hello@gameworkersolidarity.com" className="action-more-info-link">
            Let us know →
          </a>
        </div>
      </article>

      {/* Related events section */}
      {relatedEvents.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Related Events</h2>
          <EventTimeline
            events={relatedEvents.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )}
          />
        </div>
      )}
    </div>
  )
}

