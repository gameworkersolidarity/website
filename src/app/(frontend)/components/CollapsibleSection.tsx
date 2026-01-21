'use client'

import React, { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div style={{ marginTop: '2rem' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          padding: '0.5rem 0',
          cursor: 'pointer',
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '1.2rem', color: '#666' }}>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div
          style={{
            marginTop: '1rem',
            paddingLeft: '0.5rem',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
