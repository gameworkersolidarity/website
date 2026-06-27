'use client'

import { User } from '@/payload-types'
import { createContext, useContext, useEffect } from 'react'
import posthog from 'posthog-js'

export const UserContext = createContext<User | null>(null)

function PostHogIdentify() {
  const user = useContext(UserContext)
  useEffect(() => {
    if (user?.id) {
      posthog.identify(String(user.id), { is_logged_in: true })
    } else {
      posthog.reset()
    }
  }, [user?.id])
  return null
}

export function UserContextProvider({
  user,
  children,
}: {
  user: User | null
  children: React.ReactNode
}) {
  return (
    <UserContext.Provider value={user}>
      <PostHogIdentify />
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
