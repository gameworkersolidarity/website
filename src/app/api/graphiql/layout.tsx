import type { Metadata } from 'next'
import Link from 'next/link'
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
      <head>
        <style>{`
          /* Make GraphiQL fill the space between header and footer */
          body { display: flex; flex-direction: column; min-height: 100dvh; }
          main { flex: 1; min-height: 0; display: flex; flex-direction: column; }
          main > div { flex: 1; min-height: 0; display: flex; flex-direction: column; }
          main .graphiql-container { flex: 1; min-height: 0; }
        `}</style>
      </head>
      <body className="flex flex-col min-h-dvh bg-background">
        <header className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 bg-gw-pink border-b border-black/10 flex-wrap">
          <Link
            href="/"
            className="flex items-center gap-2 no-underline font-identity text-xl text-[#1a1a1a] hover:underline"
          >
            {/* Smaller logo than main site / REST docs */}
            <img
              src="/images/GameWorkerSolidarity_Logo_Transparent.png"
              alt=""
              className="block"
              width={32}
              height={32}
            />
            <span>Game Worker Solidarity</span>
          </Link>
          <Link href="/" className="text-sm text-[#1a1a1a] no-underline hover:underline">
            ← Back to site
          </Link>
        </header>
        <main className="flex-1 min-h-0 flex flex-col">{children}</main>
        <footer className="shrink-0 py-3 px-4 text-center text-sm bg-gw-pink text-[#1a1a1a] border-t border-black/10">
          <Link href="/" className="text-[#1a1a1a] no-underline hover:underline">
            Back to main site
          </Link>
        </footer>
      </body>
    </html>
  )
}
