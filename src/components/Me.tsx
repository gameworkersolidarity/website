'use client'

import { useUser } from '@/utils/UserContext'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function logout() {
  await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
  window.location.href = window.location.pathname
}

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
        {!!page.id && <code>Page ID: {page.id}</code>}
        <div className="flex items-center gap-3">
          Logged in as <Username />
          <Button variant="outline" size="sm" onClick={() => logout()}>
            Log out
          </Button>
        </div>
      </div>
    </LoggedIn>
  )
}

export function LoggedIn({ children }: { children: React.ReactNode }) {
  const user = useUser()

  if (!user?.id) {
    return null
  }

  return <>{children}</>
}

export function Username() {
  const user = useUser()

  if (!user?.id) {
    return null
  }

  return <>{user.email}</>
}
