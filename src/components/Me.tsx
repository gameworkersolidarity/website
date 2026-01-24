'use client'

import { useAsync } from '@/utils/query'
import { payloadClient } from '@/utils/payload'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function AdminEditBanner({
  page,
}: {
  page: {
    adminPath?: string
    id: string
  }
}) {
  return (
    <LoggedIn>
      <div className="flex flex-row items-center justify-between gap-4 bg-snot-300 p-4 text-black font-mono text-sm uppercase">
        <Link href={page.adminPath || '/'}>
          <Button>Edit this page</Button>
        </Link>
        <code>Page ID: {page.id}</code>
        <div>
          Logged in as <Username />
        </div>
      </div>
    </LoggedIn>
  )
}

export function LoggedIn({ children }: { children: React.ReactNode }) {
  const client = useAsync('/me', () =>
    payloadClient.me({ collection: 'users' }).then((res) => res.user),
  )

  if (!client.data?.id) {
    return null
  }

  return <>{children}</>
}

export function Username() {
  const client = useAsync('/me', () =>
    payloadClient.me({ collection: 'users' }).then((res) => res.user),
  )

  if (!client.data?.id) {
    return null
  }

  return <>{client.data?.email}</>
}
