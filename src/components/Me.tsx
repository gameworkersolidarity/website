'use client'

import useSWR from 'swr'
import { payloadClient } from '@/utils/payload'

export function LoggedIn({ children }: { children: React.ReactNode }) {
  const client = useSWR('/me', () =>
    payloadClient.me({ collection: 'users' }).then((res) => res.user),
  )

  if (client.data?.id) {
    return <>{children}</>
  }

  return null
}
