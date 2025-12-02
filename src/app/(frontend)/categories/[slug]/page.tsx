import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { CategoryPage } from './CategoryPage'
import { getSlug } from '@/utils/payloadPath'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const categoriesResult = await payload.find({
    collection: 'categories',
    where: {
      _status: {
        equals: 'published',
      },
    },
    pagination: false,
  })

  return categoriesResult.docs.map((category) => ({
    slug: getSlug('categories', category),
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const categoryResult = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: slug,
      },
      ...(!isDraftMode
        ? {
            _status: {
              equals: 'published',
            },
          }
        : {}),
    },
    depth: 0,
    draft: isDraftMode,
    limit: 1,
  })

  if (categoryResult.docs.length === 0) {
    return {
      title: 'Category Not Found',
    }
  }

  const category = categoryResult.docs[0]
  return {
    title: `${category.name} - Categories - Game Workers Solidarity Platform`,
    description: `Explore solidarity actions in the ${category.name} category.`,
  }
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
    collection: 'events',
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
    sort: ['date:desc'],
    depth: 2, // Include related entities
    draft: isDraftMode,
    pagination: false,
  })

  const events = actionsResult.docs

  return <CategoryPage initialCategory={category} events={events} />
}
