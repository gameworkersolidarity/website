import React from 'react'
import './styles.css'

export const metadata = {
  description:
    'Game Workers Solidarity Platform - Tracking solidarity actions across the global video game industry.',
  title: 'Game Workers Solidarity Platform',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
