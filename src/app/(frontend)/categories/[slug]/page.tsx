import { notFound } from 'next/navigation'
import { getCachedDataForSlug } from '@/utils/payload.server'
import { CategoryPage } from './CategoryPage'
import { capitalize } from 'lodash'
import { generateMetadataForSlug } from '@/utils/generateMetadata'
import { validatePayloadDocument, validatePayloadResult } from '@/utils/validate-payload'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateMetadataForSlug({
    collection: 'categories',
    slug,
    notFoundTitle: 'Category Not Found',
    getTitle: (category) => capitalize(category.name),
  })
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: Props) {
  const { slug } = await params

  const result = await getCachedDataForSlug('categories', slug, async ({ query }) => {
    const categoryResult = await query({
      collection: 'categories',
      depth: 2,
      limit: 1,
      where: { slug: { equals: slug } },
    })
    if (!categoryResult.docs[0]) return null

    const category = validatePayloadDocument('categories', categoryResult.docs[0])
    const actionsResult = await query({
      collection: 'actions',
      where: { and: [{ categories: { in: [category.id] } }] },
      sort: '-date',
      depth: 2,
      pagination: false,
    })
    const validatedActions = validatePayloadResult('actions', actionsResult)
    return { category, actions: validatedActions.docs }
  })

  if (!result) notFound()

  return <CategoryPage initialCategory={result.category} actions={result.actions} />
}
