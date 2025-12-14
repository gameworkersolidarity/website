import { getPayload } from 'payload'
import config from '@/payload.config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { EventSubmissionForm } from './EventSubmissionForm'

export const metadata = {
  title: 'Submit an Event',
  description: 'Submit a new event to the Game Workers Solidarity Platform',
}

export default async function SubmitEventPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = (await draftMode()).isEnabled

  try {
    // Fetch the global data for the page
    const eventSubmissionPageData = await payload.findGlobal({
      slug: 'eventSubmissionPage',
      draft: isDraftMode,
    })

    if (!eventSubmissionPageData) {
      return notFound()
    }

    // Fetch options for relationship fields
    const [categories, countries, companies, organisingGroups] = await Promise.all([
      payload.find({
        collection: 'categories',
        limit: 1000,
        pagination: false,
        sort: 'name',
      }),
      payload.find({
        collection: 'countries',
        limit: 1000,
        pagination: false,
        sort: 'name',
      }),
      payload.find({
        collection: 'companies',
        limit: 1000,
        pagination: false,
        sort: 'name',
      }),
      payload.find({
        collection: 'organisingGroups',
        limit: 1000,
        pagination: false,
        sort: 'name',
      }),
    ])

    return (
      <div className="mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4 max-w-4xl">
        <div className="columns-1">
          <h1 className="text-4xl lg:text-5xl font-bold font-identity mb-4">
            {eventSubmissionPageData.title || 'Submit an Event'}
          </h1>
          {eventSubmissionPageData.description && (
            <div className="mb-6">
              <LexicalRenderer content={eventSubmissionPageData.description} />
            </div>
          )}
        </div>

        <EventSubmissionForm
          categories={categories.docs}
          countries={countries.docs}
          companies={companies.docs}
          organisingGroups={organisingGroups.docs}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading submit event page:', error)
    return notFound()
  }
}
