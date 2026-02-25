import { notFound } from 'next/navigation'
import {
  getCachedGlobalForMetadata,
  payloadUserQuery,
  payloadUserGlobalQuery,
} from '@/utils/payload.server'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { ActionSubmissionForm } from './ActionSubmissionForm'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { projectStrings } from '@/project-strings'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const actionSubmissionPageData = await getCachedGlobalForMetadata<{
      title?: string
      description?: unknown
    }>('actionSubmissionPage')

    const title = actionSubmissionPageData?.title ?? 'Submit an Action'
    const description =
      (actionSubmissionPageData?.description != null
        ? lexicalToPlainText(
            actionSubmissionPageData.description as Parameters<typeof lexicalToPlainText>[0],
          )
        : '') || 'Submit a new action to Game Worker Solidarity'
    const shareImage = `${projectStrings.baseUrl}/images/game-workers-share-card-new.png`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: shareImage,
            width: 955,
            height: 500,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [shareImage],
      },
    }
  } catch (error) {
    const title = 'Submit an Action'
    const description = 'Submit a new action to Game Worker Solidarity'
    const shareImage = `${projectStrings.baseUrl}/images/game-workers-share-card-new.png`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: shareImage,
            width: 955,
            height: 500,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [shareImage],
      },
    }
  }
}

export default async function SubmitActionPage() {
  let actionSubmissionPageData
  let categories
  let countries
  let companies
  let organisingGroups

  try {
    // Fetch the global data for the page
    actionSubmissionPageData = await payloadUserGlobalQuery({
      slug: 'actionSubmissionPage',
    })

    if (!actionSubmissionPageData) {
      return notFound()
    }

    // Fetch options for relationship fields
    ;[categories, countries, companies, organisingGroups] = await Promise.all([
      payloadUserQuery({
        collection: 'categories',
        limit: 1000,
        pagination: false,
        sort: 'name',
      }),
      payloadUserQuery({
        collection: 'countries',
        limit: 1000,
        pagination: false,
        sort: 'name',
      }),
      payloadUserQuery({
        collection: 'companies',
        limit: 1000,
        pagination: false,
        sort: 'name',
      }),
      payloadUserQuery({
        collection: 'organisingGroups',
        limit: 1000,
        pagination: false,
        sort: 'name',
      }),
    ])
  } catch (error) {
    console.error('Error loading submit action page:', error)
    return notFound()
  }

  // Construct JSX outside try/catch to avoid error-boundaries warning
  return (
    <div className="mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4 max-w-4xl">
      <div className="columns-1">
        <h1 className="text-4xl lg:text-5xl font-bold font-identity mb-4">
          {actionSubmissionPageData.title || 'Submit an Action'}
        </h1>
        {actionSubmissionPageData.description && (
          <div className="mb-6">
            <LexicalRenderer content={actionSubmissionPageData.description} />
          </div>
        )}
      </div>

      <ActionSubmissionForm
        categories={categories.docs}
        countries={countries.docs}
        companies={companies.docs}
        organisingGroups={organisingGroups.docs}
      />
    </div>
  )
}
