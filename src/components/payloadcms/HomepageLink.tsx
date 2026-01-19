'use client'
import React from 'react'
import { projectStrings } from '../../project-strings'

export const HomepageLink: React.FC = () => {
  return (
    <div className="nav__item">
      <a
        href={projectStrings.baseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="nav__link"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          textDecoration: 'none',
          color: 'var(--theme-text)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>View Website</span>
      </a>
    </div>
  )
}
