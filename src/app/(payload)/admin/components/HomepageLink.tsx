'use client'

import React from 'react'
import { projectStrings } from '@/project-strings'

const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.5rem 1rem',
  textDecoration: 'none',
  transition: 'background-color 0.2s',
  borderRadius: '4px',
  margin: '0.25rem -1rem',
} as const

const blockStyle = {
  margin: '0.25rem -1rem',
}

export const HomepageLink: React.FC = () => {
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      window.location.href = '/admin'
    }
  }

  return (
    <div style={blockStyle}>
      <a href={projectStrings.baseUrl} rel="noopener noreferrer" style={linkStyle}>
        Go to {new URL(projectStrings.baseUrl).hostname} &rarr;
      </a>
      <button
        type="button"
        onClick={handleLogout}
        style={{
          ...linkStyle,
          width: '100%',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          font: 'inherit',
          color: 'inherit',
          textAlign: 'left',
        }}
      >
        Log out
      </button>
    </div>
  )
}
