import { slugField, type CollectionConfig } from 'payload'

export const BlogPosts: CollectionConfig = {
  slug: 'blogPosts',
  admin: {
    useAsTitle: 'Title',
    defaultColumns: ['Title', 'Date', 'Public'],
    preview: (doc) => {
      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const encodedParams = new URLSearchParams({
        slug: doc?.slug || '',
        collection: 'blogPosts',
        path: `/blog/${doc?.slug || ''}`,
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
      name: 'ByLine',
      type: 'text',
    },
    {
      name: 'Title',
      type: 'text',
      required: true,
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
    {
      name: 'Date',
      type: 'date',
      required: true,
    },
    {
      name: 'Public',
      type: 'checkbox',
      defaultValue: true,
      access: {
        read: () => true,
      },
    },
  ],
}
