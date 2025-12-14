import React, { Suspense } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import '@/app/globals.css'
import { navLinks } from '../links'
import { ThemeProvider } from '@/components/NextTheme'

export const metadata = {
  description:
    'Game Workers Solidarity Platform - Tracking solidarity actions across the global video game industry.',
  title: 'Game Workers Solidarity Platform',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  // Fetch header and footer globals
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  let headerData: { navigation?: Array<{ label: string; url: string }> } | null = null
  let footerData: { navigation?: Array<{ label: string; url: string }> } | null = null

  try {
    const result = await payload.findGlobal({
      slug: 'header',
    })
    headerData = result as { navigation?: Array<{ label: string; url: string }> }
  } catch (error) {
    console.error('Error fetching header:', error)
  }

  try {
    const result = await payload.findGlobal({
      slug: 'footer',
    })
    footerData = result as { navigation?: Array<{ label: string; url: string }> }
  } catch (error) {
    console.error('Error fetching footer:', error)
  }

  const footerNav = [
    ...(footerData?.navigation || []),
    ...(navLinks || []),
    { label: 'Admin', url: '/admin' },
  ]

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning={true}>
        <ThemeProvider defaultTheme="light" disableTransitionOnChange>
          <NuqsAdapter>
            <Suspense
              fallback={
                <div>
                  <Header navigation={headerData?.navigation || []} />
                  <main className="min-h-[75vh]">
                    <div className="flex flex-col min-h-screen items-center justify-center bg-background">
                      <div className="text-base font-semibold opacity-75">Loading...</div>
                    </div>
                  </main>
                  <div className="margin-top">
                    <Footer navigation={footerNav} />
                  </div>
                </div>
              }
            >
              <Header navigation={headerData?.navigation || []} />
              <main className="min-h-[75vh]">{children}</main>
              <div className="margin-top">
                <Footer navigation={footerNav} />
              </div>
            </Suspense>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  )
}
