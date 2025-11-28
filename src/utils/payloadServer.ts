import { CollectionSlug, Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Config } from '@/payload-types'

export async function payloadGetOrCreateCategory(payload: Payload, name: string, slug: string) {
  const category = await payload.find({
    collection: 'categories',
    where: {
      or: [
        {
          name: {
            equals: name,
          },
        },
        {
          slug: {
            equals: slug,
          },
        },
      ],
    },
    limit: 1,
  })

  if (category.docs.length > 0) {
    return category.docs[0]
  }

  const newCategory = await payload.create({
    collection: 'categories',
    data: {
      name,
      slug,
    },
  })

  return newCategory
}

export async function payloadGetOrCreateModel<
  T extends CollectionSlug,
  D extends Config['collections'][T],
>(
  payload: Payload,
  collection: T,
  dedupeData: Partial<D>,
  updateData: RequiredDataFromCollectionSlug<T>,
) {
  const model = await payload.find({
    collection,
    where: Object.fromEntries(
      Object.entries(dedupeData).map(([key, value]) => [key, { equals: value }]),
    ),
    limit: 1,
  })

  if (model.docs.length > 0) {
    return model.docs[0]
  }

  const newModel = await payload.create({
    collection,
    data: updateData,
  })

  return newModel
}
