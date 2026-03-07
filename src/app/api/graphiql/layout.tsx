import type { Metadata } from 'next'
import '@/app/globals.css'
import 'graphiql/graphiql.css'
import 'graphiql/style.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'GraphiQL – Game Worker Solidarity API',
}

export default function GraphiQLLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head></head>
      <body>{children}</body>
    </html>
  )
}
