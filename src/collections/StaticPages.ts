import { slugField, type CollectionConfig } from 'payload'

export const StaticPages: CollectionConfig = {
  slug: 'staticPages',
  admin: {
    useAsTitle: 'Title',
    preview: (doc) => {
      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'staticPages',
        path: `/${slug}`,
        previewSecret,
      })

      return `/preview?${encodedParams.toString()}`
    },
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
      schedulePublish: true,
    },
  },
  fields: [
    slugField({
      fieldToUse: 'Title',
    }),
    {
      name: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'Summary',
      type: 'text',
    },
    {
      name: 'Body',
      type: 'richText',
      required: true,
    },
  ],
}
