import React, { Suspense } from 'react'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomepageSkeleton } from './components/HomepageSkeleton'
import '@/app/globals.css'
import { navLinks } from '../links'
import { ThemeProvider } from '@/components/NextTheme'
import { projectStrings } from '@/project-strings'
import { backupShareCard } from '@/utils/shareCard'
import type { Metadata } from 'next/dist/types'
import { UserContextProvider } from '@/utils/UserContext'
import { loadDraftMode } from '@/utils/auth'
import { CountryFlagPolyfill } from '@/components/CountryFlagPolyfill'
import { payloadUserGlobalQuery } from '@/utils/payload.server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const metadata: Metadata = {
  metadataBase: new URL(projectStrings.baseUrl),
  title: {
    default: 'Game Worker Solidarity',
    template: '%s | Game Worker Solidarity',
  },
  description:
    'Tracking solidarity actions across the global video game industry. Archive of worker organizing, strikes, unionization efforts, and collective action in game development.',
  keywords: [
    'game workers',
    'video game industry',
    'worker solidarity',
    'union organizing',
    'game development',
    'labor rights',
    'strikes',
    'collective action',
    'game industry unions',
    'worker organizing',
  ],
  authors: [{ name: 'Game Worker Solidarity' }],
  creator: 'Game Worker Solidarity',
  publisher: 'Game Worker Solidarity',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: projectStrings.baseUrl,
    siteName: 'Game Worker Solidarity',
    title: 'Game Worker Solidarity',
    description:
      'Tracking solidarity actions across the global video game industry. Archive of worker organizing, strikes, unionization efforts, and collective action in game development.',
    images: [backupShareCard],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Game Worker Solidarity',
    description:
      'Tracking solidarity actions across the global video game industry. Archive of worker organizing, strikes, unionization efforts, and collective action.',
    images: [`${projectStrings.baseUrl}/images/game-workers-share-card-new.png`],
    creator: projectStrings.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: projectStrings.baseUrl,
  },
  verification: {
    // Add verification codes if you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

/** Skip static generation at build; layout uses headers() (draft mode, Payload). */
export const dynamic = 'force-dynamic'

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  // Fetch header and footer globals
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  let headerData: { navigation?: Array<{ label: string; url: string }> } | null = null
  let footerData: { navigation?: Array<{ label: string; url: string }> } | null = null

  try {
    const result = await payloadUserGlobalQuery({
      slug: 'header',
    })
    headerData = result as { navigation?: Array<{ label: string; url: string }> }
  } catch (error) {
    console.error('Error fetching header:', error)
  }

  try {
    const result = await payloadUserGlobalQuery({
      slug: 'footer',
    })
    footerData = result as { navigation?: Array<{ label: string; url: string }> }
  } catch (error) {
    console.error('Error fetching footer:', error)
  }

  const footerNav = [...(footerData?.navigation || []), ...(navLinks || [])]

  const { authStatus } = await loadDraftMode(payload)

  const userForContext = authStatus?.user && 'email' in authStatus.user ? authStatus.user : null

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning={true}>
        <a
          href="#main-content"
          className="absolute left-[-10000px] top-4 z-[100] px-4 py-2 bg-gw-pink text-white rounded-lg outline-none ring-2 ring-white focus:left-4"
        >
          Skip to main content
        </a>
        <NuqsAdapter>
          <UserContextProvider user={userForContext}>
            <ThemeProvider defaultTheme="light" disableTransitionOnChange>
              <CountryFlagPolyfill />
              <Suspense
                fallback={
                  <div>
                    <Header navigation={headerData?.navigation || []} />
                    <main id="main-content" className="min-h-[75vh] flex-1 flex flex-col">
                      <HomepageSkeleton />
                    </main>
                    <div className="margin-top">
                      <Footer navigation={footerNav} />
                    </div>
                  </div>
                }
              >
                <Header navigation={headerData?.navigation || []} />
                <main id="main-content" className="min-h-[75vh] flex-1 flex flex-col">
                  {children}
                </main>
                <div className="margin-top">
                  <Footer navigation={footerNav} />
                </div>
              </Suspense>
            </ThemeProvider>
          </UserContextProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
