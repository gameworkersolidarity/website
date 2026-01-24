'use client'

import { User } from '@/payload-types'
import { createContext, useContext } from 'react'

export const UserContext = createContext<User | null>(null)

export function UserContextProvider({
  user,
  children,
}: {
  user: User | null
  children: React.ReactNode
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser() {
  return useContext(UserContext)
}
