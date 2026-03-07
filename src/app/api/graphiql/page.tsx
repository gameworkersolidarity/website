'use client'

import { projectStrings } from '@/project-strings'
import { createGraphiQLFetcher } from '@graphiql/toolkit'
import { GraphiQL } from 'graphiql'

const fetcher = createGraphiQLFetcher({ url: `${projectStrings.baseUrl}/api/graphql` })

export default function GraphiQLPage() {
  if (!fetcher) {
    return <div className="flex h-dvh w-full items-center justify-center text-2xl">Loading…</div>
  }

  return (
    <div className="h-dvh w-full">
      <GraphiQL fetcher={fetcher} />
    </div>
  )
}
