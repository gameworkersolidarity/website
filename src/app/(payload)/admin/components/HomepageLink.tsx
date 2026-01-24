import React from 'react'
import { projectStrings } from '@/project-strings'

export const HomepageLink: React.FC = () => {
  return (
    <a
      href={projectStrings.baseUrl}
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        textDecoration: 'none',
        transition: 'background-color 0.2s',
        borderRadius: '4px',
        margin: '0.25rem -1rem',
      }}
    >
      Go to {new URL(projectStrings.baseUrl).hostname} &rarr;
    </a>
  )
}
