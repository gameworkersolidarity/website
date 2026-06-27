'use client'

import React, { useState } from 'react'

export default function BustCacheWidget() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleBustCache() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/bust-cache', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({
          type: 'error',
          text: data.error || `Request failed (${res.status})`,
        })
        return
      }
      setMessage({
        type: 'success',
        text: `Cache busted. ${(data.revalidated as string[]).length} tags revalidated.`,
      })
    } catch (e) {
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Failed to bust cache',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        padding: '1.5rem',
        background: 'var(--theme-elevation-50)',
        borderRadius: '4px',
        boxSizing: 'border-box',
        margin: 0,
      }}
    >
      <div
        style={{
          fontSize: '1rem',
          fontWeight: '500',
          color: 'var(--theme-text)',
          marginBottom: '0.75rem',
        }}
      >
        Cache
      </div>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--theme-text-muted)',
          marginBottom: '1rem',
        }}
      >
        Homepage and index pages are cached for performance. After bulk changes or if something
        looks stale, bust the cache to revalidate on next visit.
      </p>
      <button
        type="button"
        onClick={handleBustCache}
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--theme-elevation-0)',
          background: 'var(--theme-elevation-800)',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Busting…' : 'Bust all caches'}
      </button>
      {message && (
        <p
          style={{
            marginTop: '0.75rem',
            fontSize: '0.875rem',
            color:
              message.type === 'success' ? 'var(--theme-success-500)' : 'var(--theme-error-500)',
          }}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
