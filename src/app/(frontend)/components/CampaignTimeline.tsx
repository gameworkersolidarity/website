'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import type { Action } from '@/payload-types'

interface TimelineAction {
  id?: string
  action: number | Action
  parentAction?: number | Action | null
  linkType?: 'strong' | 'weak' | 'none' | null
  linkDescription?: string | null
  displayOrder?: number | null
}

interface CampaignTimelineProps {
  timelineActions: TimelineAction[]
}

interface TimelineNode {
  action: Action
  linkType: 'strong' | 'weak' | 'none'
  linkDescription?: string | null
  children: TimelineNode[]
}

export function CampaignTimeline({ timelineActions }: CampaignTimelineProps) {
  // Build hierarchical tree structure
  const timelineTree = useMemo(() => {
    // First, resolve all actions (convert IDs to objects)
    const actionMap = new Map<number | string, Action>()
    const nodes: Array<{ timelineAction: TimelineAction; action: Action | null }> = []

    timelineActions.forEach((timelineAction) => {
      const action = typeof timelineAction.action === 'object' ? timelineAction.action : null
      if (action) {
        actionMap.set(action.id, action)
        nodes.push({ timelineAction, action })
      }
    })

    // Build parent-child relationships
    const nodeMap = new Map<number | string, TimelineNode>()
    const rootNodes: TimelineNode[] = []

    // First pass: create all nodes
    nodes.forEach(({ timelineAction, action }) => {
      if (!action) return

      const node: TimelineNode = {
        action,
        linkType: (timelineAction.linkType || 'none') as 'strong' | 'weak' | 'none',
        linkDescription: timelineAction.linkDescription,
        children: [],
      }
      nodeMap.set(action.id, node)
    })

    // Second pass: build parent-child relationships
    nodes.forEach(({ timelineAction, action }) => {
      if (!action) return
      const node = nodeMap.get(action.id)
      if (!node) return

      const parentAction =
        typeof timelineAction.parentAction === 'object'
          ? timelineAction.parentAction
          : timelineAction.parentAction && actionMap.get(timelineAction.parentAction)
            ? actionMap.get(timelineAction.parentAction)!
            : null

      if (parentAction && parentAction.id !== action.id) {
        // Avoid self-referential parents
        const parentNode = nodeMap.get(parentAction.id)
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
        return new Date(a.action.date).getTime() - new Date(b.action.date).getTime()
      })
      node.children.forEach(sortNode)
    }

    rootNodes.forEach(sortNode)
    rootNodes.sort((a, b) => new Date(a.action.date).getTime() - new Date(b.action.date).getTime())

    return rootNodes
  }, [timelineActions])

  const renderNode = (node: TimelineNode, level: number = 0): React.ReactNode => {
    const date = new Date(node.action.date)
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
      <div key={node.action.id} style={{ marginLeft: `${level * 2}rem`, marginBottom: '1.5rem' }}>
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
            {node.action.location && (
              <span style={{ fontSize: '0.875rem', color: '#888' }}>• {node.action.location}</span>
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

          {node.action.slug ? (
            <Link
              href={`/actions/${node.action.slug}`}
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#4A90E2',
                textDecoration: 'none',
              }}
            >
              {node.action.name}
            </Link>
          ) : (
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              {node.action.name}
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

          {node.action.link && (
            <a
              href={node.action.link}
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
        No timeline actions available.
      </div>
    )
  }

  return (
    <div className="campaign-timeline" style={{ padding: '1rem 0' }}>
      {timelineTree.map((rootNode) => renderNode(rootNode))}
    </div>
  )
}
