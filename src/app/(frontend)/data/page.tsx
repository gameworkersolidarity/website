import { projectStrings } from '@/project-strings'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { draftMode } from 'next/headers'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Metadata } from 'next'

export default async function DataPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = (await draftMode()).isEnabled

  try {
    // Fetch the global data for the description
    const dataPageData = await payload.findGlobal({
      slug: 'dataPage',
      draft: isDraftMode,
    })

    if (!dataPageData) {
      return notFound()
    }

    return (
      <article className="content-wrapper p-4 md:p-6 lg:p-8 space-y-6">
        <header className="space-y-4">
          <h1 className="font-identity text-4xl lg:text-5xl font-bold">Get the data</h1>
          {dataPageData?.description && (
            <div className="max-w-3xl">
              <LexicalRenderer content={dataPageData.description} />
            </div>
          )}
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
          <Link href="/api/docs" className="block">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-auto min-h-[120px] flex flex-col items-center justify-center gap-3 text-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
              <span>API Documentation</span>
            </Button>
          </Link>

          <Link href="/api/graphql-playground" className="block">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-auto min-h-[120px] flex flex-col items-center justify-center gap-3 text-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                />
              </svg>
              <span>GraphQL Playground</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            className="w-full h-auto min-h-[120px] flex flex-col items-center justify-center gap-3 text-lg"
            disabled
          >
            <span>Coming soon: CSV downloads</span>
          </Button>
        </div>
      </article>
    )
  } catch (error) {
    return notFound()
  }
}

export const metadata: Metadata = {
  title: 'Get the data',
  description: 'Get the data from the Game Workers Solidarity Platform',
}
