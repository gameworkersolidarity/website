import { slugField, type CollectionConfig } from 'payload'

export const BlogPosts: CollectionConfig = {
  slug: 'blogPosts',
  trash: true,
  admin: {
    useAsTitle: 'Title',
    defaultColumns: ['Title', 'Date'],
    preview: (doc) => {
      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'blogPosts',
        path: `/blog/${slug}`,
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
    {
      name: 'airtableId',
      type: 'text',
      unique: true,
      admin: {
        description: 'Legacy Airtable ID for URL redirects',
      },
      hidden: true,
    },
    slugField({
      fieldToUse: 'Title',
    }),
    {
      name: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'ByLine',
      type: 'text',
    },
    {
      name: 'Image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'Summary',
      type: 'textarea',
    },
    {
      name: 'Body',
      type: 'richText',
      required: true,
    },
  ],
}
