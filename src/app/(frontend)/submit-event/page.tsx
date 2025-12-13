import { getPayload } from 'payload'
import config from '@/payload.config'
import { draftMode } from 'next/headers'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { EventSubmissionForm } from './EventSubmissionForm'
import { notFound } from 'next/navigation'
import type { Category, Country, Company, OrganisingGroup } from '@/payload-types'

export const metadata = {
  title: 'Submit an Event - Game Workers Solidarity Platform',
  description: 'Submit an event to the Game Workers Solidarity Platform',
}

export default async function SubmitEventPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = (await draftMode()).isEnabled

  try {
    // Fetch the global data for the page
    const pageData = await payload.findGlobal({
      slug: 'eventSubmissionPage',
      draft: isDraftMode,
    })

    if (!pageData) {
      return notFound()
    }

    // Fetch all categories, countries, companies, and organising groups for the form
    const [categoriesResult, countriesResult, companiesResult, organisingGroupsResult] =
      await Promise.all([
        payload.find({
          collection: 'categories',
          where: {
            ...(!isDraftMode
              ? {
                  _status: {
                    equals: 'published',
                  },
                }
              : {}),
          },
          pagination: false,
          sort: 'name',
          draft: isDraftMode,
        }),
        payload.find({
          collection: 'countries',
          where: {
            ...(!isDraftMode
              ? {
                  _status: {
                    equals: 'published',
                  },
                }
              : {}),
          },
          pagination: false,
          sort: 'name',
          draft: isDraftMode,
        }),
        payload.find({
          collection: 'companies',
          where: {
            ...(!isDraftMode
              ? {
                  _status: {
                    equals: 'published',
                  },
                }
              : {}),
          },
          pagination: false,
          sort: 'name',
          draft: isDraftMode,
        }),
        payload.find({
          collection: 'organisingGroups',
          where: {
            ...(!isDraftMode
              ? {
                  _status: {
                    equals: 'published',
                  },
                }
              : {}),
          },
          pagination: false,
          sort: 'name',
          draft: isDraftMode,
        }),
      ])

    const categories = categoriesResult.docs as Category[]
    const countries = countriesResult.docs as Country[]
    const companies = companiesResult.docs as Company[]
    const organisingGroups = organisingGroupsResult.docs as OrganisingGroup[]

    const title = pageData.title || 'Submit an Event'

    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        <header>
          <h1 className="text-4xl lg:text-5xl font-bold font-identity mb-4">{title}</h1>
          {pageData.description && <LexicalRenderer content={pageData.description} />}
        </header>

        <EventSubmissionForm
          categories={categories}
          countries={countries}
          companies={companies}
          organisingGroups={organisingGroups}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading submit event page:', error)
    return notFound()
  }
}
