'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import type { Event } from '@/payload-types'

interface TimelineEvent {
  id?: string
  event: number | Event
  parentEvent?: number | Event | null
  linkType?: 'strong' | 'weak' | 'none' | null
  linkDescription?: string | null
  displayOrder?: number | null
}

interface CampaignTimelineProps {
  timelineEvents: TimelineEvent[]
}

interface TimelineNode {
  event: Event
  linkType: 'strong' | 'weak' | 'none'
  linkDescription?: string | null
  children: TimelineNode[]
}

export function CampaignTimeline({ timelineEvents }: CampaignTimelineProps) {
  // Build hierarchical tree structure
  const timelineTree = useMemo(() => {
    // First, resolve all events (convert IDs to objects)
    const eventMap = new Map<number | string, Event>()
    const nodes: Array<{ timelineEvent: TimelineEvent; event: Event | null }> = []

    timelineEvents.forEach((timelineEvent) => {
      const event = typeof timelineEvent.event === 'object' ? timelineEvent.event : null
      if (event) {
        eventMap.set(event.id, event)
        nodes.push({ timelineEvent, event })
      }
    })

    // Build parent-child relationships
    const nodeMap = new Map<number | string, TimelineNode>()
    const rootNodes: TimelineNode[] = []

    // First pass: create all nodes
    nodes.forEach(({ timelineEvent, event }) => {
      if (!event) return

      const node: TimelineNode = {
        event,
        linkType: (timelineEvent.linkType || 'none') as 'strong' | 'weak' | 'none',
        linkDescription: timelineEvent.linkDescription,
        children: [],
      }
      nodeMap.set(event.id, node)
    })

    // Second pass: build parent-child relationships
    nodes.forEach(({ timelineEvent, event }) => {
      if (!event) return
      const node = nodeMap.get(event.id)
      if (!node) return

      const parentEvent =
        typeof timelineEvent.parentEvent === 'object'
          ? timelineEvent.parentEvent
          : timelineEvent.parentEvent && eventMap.get(timelineEvent.parentEvent)
            ? eventMap.get(timelineEvent.parentEvent)!
            : null

      if (parentEvent && parentEvent.id !== event.id) {
        // Avoid self-referential parents
        const parentNode = nodeMap.get(parentEvent.id)
        if (parentNode) {
          parentNode.children.push(node)
        } else {
          // Parent not found in timeline, treat as root
          rootNodes.push(node)
        }
      } else {
        // No parent or self-referential, treat as root
        rootNodes.push(node)
      }
    })

    // Sort children by date
    const sortNode = (node: TimelineNode) => {
      node.children.sort((a, b) => {
        return new Date(a.event.date).getTime() - new Date(b.event.date).getTime()
      })
      node.children.forEach(sortNode)
    }

    rootNodes.forEach(sortNode)
    rootNodes.sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime())

    return rootNodes
  }, [timelineEvents])

  const renderNode = (node: TimelineNode, level: number = 0): React.ReactNode => {
    const date = new Date(node.event.date)
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    const linkColor =
      node.linkType === 'strong' ? '#e74c3c' : node.linkType === 'weak' ? '#f39c12' : '#4A90E2'
    const linkWidth = node.linkType === 'strong' ? '3px' : node.linkType === 'weak' ? '2px' : '3px'
    const linkStyle =
      node.linkType === 'strong' ? 'solid' : node.linkType === 'weak' ? 'dashed' : 'solid'

    return (
      <div key={node.event.id} style={{ marginLeft: `${level * 2}rem`, marginBottom: '1.5rem' }}>
        <div
          style={{
            padding: '1rem',
            borderLeft: `${linkWidth} ${linkStyle} ${linkColor}`,
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.75rem',
              marginBottom: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: '500' }}>
              {formattedDate}
            </span>
            {node.event.location && (
              <span style={{ fontSize: '0.875rem', color: '#888' }}>• {node.event.location}</span>
            )}
            {node.linkType !== 'none' && (
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor:
                    node.linkType === 'strong'
                      ? 'rgba(231, 76, 60, 0.1)'
                      : 'rgba(243, 156, 18, 0.1)',
                  color: node.linkType === 'strong' ? '#e74c3c' : '#f39c12',
                  fontWeight: '500',
                }}
              >
                {node.linkType === 'strong' ? 'Direct Link' : 'Indirect Link'}
              </span>
            )}
          </div>

          {node.event.slug ? (
            <Link
              href={`/events/${node.event.slug}`}
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#4A90E2',
                textDecoration: 'none',
              }}
            >
              {node.event.title}
            </Link>
          ) : (
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              {node.event.title}
            </h4>
          )}

          {node.linkDescription && (
            <p
              style={{
                fontSize: '0.875rem',
                color: '#666',
                fontStyle: 'italic',
                marginBottom: '0.5rem',
                paddingLeft: '0.5rem',
                borderLeft: '2px solid #ddd',
              }}
            >
              {node.linkDescription}
            </p>
          )}

          {node.event.link && (
            <a
              href={node.event.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.875rem', color: '#4A90E2', textDecoration: 'none' }}
            >
              Learn more →
            </a>
          )}
        </div>

        {node.children.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (timelineTree.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
        No timeline events available.
      </div>
    )
  }

  return (
    <div className="campaign-timeline" style={{ padding: '1rem 0' }}>
      {timelineTree.map((rootNode) => renderNode(rootNode))}
    </div>
  )
}
