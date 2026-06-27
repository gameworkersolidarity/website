'use client'

import React from 'react'
import Image from 'next/image'

export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <Image
        src="/images/GameWorkerSolidarity_Logo_Transparent.png"
        width={40}
        height={40}
        alt="Game Worker Solidarity Logo"
        style={{
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 4px rgba(221, 150, 255, 0.2))',
        }}
        className="dark:opacity-90"
      />
      <span
        style={{
          fontFamily: 'Parabole, ui-sans-serif, system-ui, sans-serif',
          fontSize: '1.1rem',
          fontWeight: 400,
          color: 'var(--theme-text)',
        }}
      >
        Game Worker Solidarity
      </span>
    </div>
  )
}
