import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { CategoryPage } from './CategoryPage'
import { getSlug } from '@/utils/payloadPath'
import { capitalize } from 'lodash'
import { generateMetadataForSlug } from '@/utils/generateMetadata'

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
  const isDraftMode = (await draftMode()).isEnabled

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const category = await payload
    .find({
      collection: 'categories',
      depth: 2, // Include related solidarity actions and their related entities
      draft: isDraftMode,
      limit: 1,
      where: {
        slug: {
          equals: slug,
        },
        // Only fetch published content when not in draft mode
        ...(!isDraftMode
          ? {
              _status: {
                equals: 'published',
              },
            }
          : {}),
      },
    })
    .then(({ docs }) => docs?.[0])

  if (!category) {
    notFound()
  }

  // Query solidarity actions directly where this category is related
  const actionsResult = await payload.find({
    collection: 'actions',
    where: {
      and: [
        {
          categories: {
            in: [category.id],
          },
        },
        ...(!isDraftMode
          ? [
              {
                _status: {
                  equals: 'published',
                },
              },
            ]
          : []),
      ],
    },
    sort: '-date',
    depth: 2, // Include related entities
    draft: isDraftMode,
    pagination: false,
  })

  const actions = actionsResult.docs

  return <CategoryPage initialCategory={category} actions={actions} />
}
