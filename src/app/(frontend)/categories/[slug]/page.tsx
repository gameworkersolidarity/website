import { notFound } from 'next/navigation'
import { payloadUserQuery } from '@/utils/payload.server'
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

  const category = await payloadUserQuery({
    collection: 'categories',
    depth: 2, // Include related solidarity actions and their related entities
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  }).then(({ docs }) => docs?.[0])

  if (!category) {
    notFound()
  }

  // Query solidarity actions directly where this category is related
  const actionsResult = await payloadUserQuery({
    collection: 'actions',
    where: {
      and: [
        {
          categories: {
            in: [category.id],
          },
        },
      ],
    },
    sort: '-date',
    depth: 2, // Include related entities
    pagination: false,
  })

  const actions = actionsResult.docs

  return <CategoryPage initialCategory={category} actions={actions} />
}
