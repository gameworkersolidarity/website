'use client'

import useSWR from 'swr'
import { payloadClient } from '@/utils/payload'

export function LoggedIn({ children }: { children: React.ReactNode }) {
  const client = useSWR('/me', () =>
    payloadClient.me({ collection: 'users' }).then((res) => res.user),
  )

  if (!client.data?.id) {
    return null
  }

  return <>{children}</>
}

export function Username() {
  const client = useSWR('/me', () =>
    payloadClient.me({ collection: 'users' }).then((res) => res.user),
  )

  if (!client.data?.id) {
    return null
  }

  return <>{client.data?.email}</>
}
