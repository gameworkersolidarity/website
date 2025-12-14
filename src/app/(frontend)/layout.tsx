import React, { Suspense } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import '@/app/globals.css'
import { navLinks } from '../links'
import { ThemeProvider } from '@/components/NextTheme'
import { projectStrings } from '@/project-strings'
import type { Metadata } from 'next'
import { StructuredData } from '@/components/StructuredData'

export const metadata: Metadata = {
  metadataBase: new URL(projectStrings.baseUrl),
  title: {
    default: 'Game Workers Solidarity Platform',
    template: '%s | Game Workers Solidarity Platform',
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
  authors: [{ name: 'Game Workers Solidarity Platform' }],
  creator: 'Game Workers Solidarity Platform',
  publisher: 'Game Workers Solidarity Platform',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: projectStrings.baseUrl,
    siteName: 'Game Workers Solidarity Platform',
    title: 'Game Workers Solidarity Platform',
    description:
      'Tracking solidarity actions across the global video game industry. Archive of worker organizing, strikes, unionization efforts, and collective action in game development.',
    images: [
      {
        url: `${projectStrings.baseUrl}/icon/icon.png`,
        width: 1200,
        height: 630,
        alt: 'Game Workers Solidarity Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Game Workers Solidarity Platform',
    description:
      'Tracking solidarity actions across the global video game industry. Archive of worker organizing, strikes, unionization efforts, and collective action.',
    images: [`${projectStrings.baseUrl}/icon/icon.png`],
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
